
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get('/', (req, res) => {
    res.json({
        message: 'University Research Opportunity Portal API is running'
    });
});

// Health check: test database connection
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        res.json({
            status: 'OK',
            database: 'Connected'
        });
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            status: 'Error',
            database: 'Disconnected'
        });
    }
});

// 1. CREATE an opportunity
app.post('/api/opportunities', async (req, res) => {
    try {
        const {
            title,
            description,
            research_area,
            faculty_name,
            department,
            required_skills,
            available_positions,
            application_deadline,
            status
        } = req.body;

        // Required field validation
        if (
            typeof title !== 'string' || !title.trim() ||
            typeof description !== 'string' || !description.trim() ||
            typeof research_area !== 'string' || !research_area.trim() ||
            typeof faculty_name !== 'string' || !faculty_name.trim() ||
            typeof department !== 'string' || !department.trim() ||
            typeof required_skills !== 'string' || !required_skills.trim() ||
            !Number.isInteger(available_positions) ||
            available_positions < 1 ||
            typeof application_deadline !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(application_deadline) ||
            !['Open', 'Closed'].includes(status ?? 'Open')
        ) {
            return res.status(400).json({
                error: 'Please provide valid values for all required fields.'
            });
        }

        // Check that the date is a real calendar date
        const date = new Date(`${application_deadline}T00:00:00Z`);

        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== application_deadline
        ) {
            return res.status(400).json({
                error: 'Application deadline must be a valid date in YYYY-MM-DD format.'
            });
        }

        const sql = `
            INSERT INTO opportunities (
                title, description, research_area, faculty_name,
                department, required_skills, available_positions,
                application_deadline, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            title.trim(),
            description.trim(),
            research_area.trim(),
            faculty_name.trim(),
            department.trim(),
            required_skills.trim(),
            available_positions,
            application_deadline,
            status ?? 'Open'
        ];

        const [result] = await pool.execute(sql, values);

        const [rows] = await pool.execute(
            'SELECT * FROM opportunities WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            message: 'Opportunity created successfully',
            opportunity: rows[0]
        });
    } catch (error) {
        console.error('Create opportunity error:', error.message);

        res.status(500).json({
            error: 'Failed to create opportunity.'
        });
    }
});

// 2. READ all opportunities
app.get('/api/opportunities', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM opportunities ORDER BY created_at DESC'
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error('Get opportunities error:', error.message);

        res.status(500).json({
            error: 'Failed to retrieve opportunities.'
        });
    }
});

// 3. READ one opportunity by ID
app.get('/api/opportunities/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                error: 'Opportunity ID must be a positive integer.'
            });
        }

        const [rows] = await pool.execute(
            'SELECT * FROM opportunities WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Opportunity not found.'
            });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Get opportunity error:', error.message);

        res.status(500).json({
            error: 'Failed to retrieve opportunity.'
        });
    }
});

// 4. UPDATE an opportunity
app.put('/api/opportunities/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                error: 'Opportunity ID must be a positive integer.'
            });
        }

        const {
            title,
            description,
            research_area,
            faculty_name,
            department,
            required_skills,
            available_positions,
            application_deadline,
            status
        } = req.body;

        if (
            typeof title !== 'string' || !title.trim() ||
            typeof description !== 'string' || !description.trim() ||
            typeof research_area !== 'string' || !research_area.trim() ||
            typeof faculty_name !== 'string' || !faculty_name.trim() ||
            typeof department !== 'string' || !department.trim() ||
            typeof required_skills !== 'string' || !required_skills.trim() ||
            !Number.isInteger(available_positions) ||
            available_positions < 1 ||
            typeof application_deadline !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(application_deadline) ||
            !['Open', 'Closed'].includes(status)
        ) {
            return res.status(400).json({
                error: 'Please provide valid values for all required fields.'
            });
        }

        const date = new Date(`${application_deadline}T00:00:00Z`);

        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== application_deadline
        ) {
            return res.status(400).json({
                error: 'Application deadline must be a valid date in YYYY-MM-DD format.'
            });
        }

        const sql = `
            UPDATE opportunities
            SET title = ?,
                description = ?,
                research_area = ?,
                faculty_name = ?,
                department = ?,
                required_skills = ?,
                available_positions = ?,
                application_deadline = ?,
                status = ?
            WHERE id = ?
        `;

        const values = [
            title.trim(),
            description.trim(),
            research_area.trim(),
            faculty_name.trim(),
            department.trim(),
            required_skills.trim(),
            available_positions,
            application_deadline,
            status,
            id
        ];

        const [result] = await pool.execute(sql, values);

        if (result.affectedRows === 0) {
            const [rows] = await pool.execute(
                'SELECT id FROM opportunities WHERE id = ?',
                [id]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    error: 'Opportunity not found.'
                });
            }
        }

        const [rows] = await pool.execute(
            'SELECT * FROM opportunities WHERE id = ?',
            [id]
        );

        res.status(200).json({
            message: 'Opportunity updated successfully',
            opportunity: rows[0]
        });
    } catch (error) {
        console.error('Update opportunity error:', error.message);

        res.status(500).json({
            error: 'Failed to update opportunity.'
        });
    }
});

// 5. DELETE an opportunity
app.delete('/api/opportunities/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                error: 'Opportunity ID must be a positive integer.'
            });
        }

        const [result] = await pool.execute(
            'DELETE FROM opportunities WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Opportunity not found.'
            });
        }

        res.status(200).json({
            message: 'Opportunity deleted successfully'
        });
    } catch (error) {
        console.error('Delete opportunity error:', error.message);

        res.status(500).json({
            error: 'Failed to delete opportunity.'
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
