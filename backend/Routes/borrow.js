import express from 'express';
import dbPromise from '../db.js'; 

const router = express.Router();


router.post('/add', async (req, res) => {
    const { userID, amount, remark } = req.body;

    if (!userID || !amount || !remark) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const db = await dbPromise;
        const user = await db.get('SELECT * FROM Finance WHERE userID = ?', [userID]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const borrowData = JSON.parse(user.borrow || '{}');
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString();
        const date = now.getDate().toString();

        if (!borrowData[year]) {
            borrowData[year] = {};
        }
        if (!borrowData[year][month]) {
            borrowData[year][month] = {};
        }
        if (!borrowData[year][month][date]) {
            borrowData[year][month][date] = [];
        }

        borrowData[year][month][date].push([amount, remark]);

        await db.run('UPDATE Finance SET borrow = ? WHERE userID = ?', [
            JSON.stringify(borrowData), userID
        ]);

        res.status(201).json({ message: 'Borrow entry added successfully' });
    } catch (err) {
        console.error('Error adding borrow entry:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.delete('/delete/:userID/:year/:month/:date/:index', async (req, res) => {
    const { userID, year, month, date, index } = req.params;

    try {
        const db = await dbPromise;
        const user = await db.get('SELECT * FROM Finance WHERE userID = ?', [userID]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const borrowData = JSON.parse(user.borrow || '{}');

        
        if (!borrowData[year] || !borrowData[year][month] || !borrowData[year][month][date] || !borrowData[year][month][date][index]) {
            return res.status(404).json({ error: 'Borrow entry not found' });
        }

        
        borrowData[year][month][date].splice(index, 1);

        
        if (borrowData[year][month][date].length === 0) {
            delete borrowData[year][month][date];
        }
        if (Object.keys(borrowData[year][month]).length === 0) {
            delete borrowData[year][month];
        }
        if (Object.keys(borrowData[year]).length === 0) {
            delete borrowData[year];
        }

        
        await db.run('UPDATE Finance SET borrow = ? WHERE userID = ?', [
            JSON.stringify(borrowData), userID
        ]);

        res.json({ message: 'Borrow entry deleted successfully' });
    } catch (err) {
        console.error('Error deleting borrow entry:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/get-by-date/:userID/:year/:month/:date', async (req, res) => {
    const { userID, year, month, date } = req.params;

    try {
        const db = await dbPromise;
        const user = await db.get('SELECT * FROM Finance WHERE userID = ?', [userID]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const borrowData = JSON.parse(user.borrow || '{}');

        if (!borrowData[year] || !borrowData[year][month] || !borrowData[year][month][date]) {
            return res.status(404).json({ error: 'No borrow entries found for the specified date' });
        }

        const borrowEntries = borrowData[year][month][date];

        res.json({ borrowEntries });
    } catch (err) {
        console.error('Error fetching borrow entries:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/summary/:userID/:year/:month/:date', async (req, res) => {
    const { userID, year, month, date } = req.params;

    try {
        const db = await dbPromise;
        const user = await db.get('SELECT * FROM Finance WHERE userID = ?', [userID]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const borrowData = JSON.parse(user.borrow || '{}');
        const monthlyBorrowEntries = borrowData[year]?.[month] || {};
        const dailyBorrowEntries = monthlyBorrowEntries[date] || [];

        
        let monthlyTotal = 0;
        for (const day in monthlyBorrowEntries) {
            const entries = monthlyBorrowEntries[day];
            for (const [amount] of entries) {
                monthlyTotal += parseFloat(amount);
            }
        }

        
        let dailyTotal = 0;
        for (const [amount] of dailyBorrowEntries) {
            dailyTotal += parseFloat(amount);
        }

        
        let overallTotal = 0;
        for (const yearKey in borrowData) {
            for (const monthKey in borrowData[yearKey]) {
                for (const dayKey in borrowData[yearKey][monthKey]) {
                    const entries = borrowData[yearKey][monthKey][dayKey];
                    for (const [amount] of entries) {
                        overallTotal += parseFloat(amount);
                    }
                }
            }
        }

        res.json({
            month: { entries: monthlyBorrowEntries, total: monthlyTotal },
            date: { entries: dailyBorrowEntries, total: dailyTotal },
            overallTotal
        });
    } catch (err) {
        console.error('Error fetching borrow summary:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
