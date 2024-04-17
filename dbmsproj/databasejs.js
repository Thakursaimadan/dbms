const express = require('express');
const app = express();
const { Client } = require('pg');
const bodyParser = require('body-parser'); // Import bodyParser to handle POST requests

const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "Qwerty@6570",
    database: "WashingMachineLiveStatus"
});

client.connect()
    .then(() => {
        console.log("Db connected -");
    })
    .catch((error) => {
        console.error("Error connecting to the database:", error);
    });

// Middleware to parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Serve the login.html file
app.get('/login.html', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Serve the securityView.html file
app.get('/securityView.html', (req, res) => {
    res.sendFile(__dirname + '/securityView.html');
});

// Serve the feedbackPage.html file
app.get('/feedbackPage.html', (req, res) => {
    res.sendFile(__dirname + '/feedbackPage.html');
});

//Serve feedbackAdminPage.html file
app.get('/feedbackAdminPage.html', (req, res) => {
    res.sendFile(__dirname + '/feedbackAdminPage.html');
});

//Serve maintenancePage.html file
app.get('/maintenancePage.html', (req, res) => {
    res.sendFile(__dirname + '/maintenancePage.html');
});

// Define a route to handle login requests
app.post('/login', bodyParser.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;
    // Check if the username is "security" and any password
    if (username === 'security') {
        res.redirect('/securityView.html'); // Redirect to securityview.html
    } else {
        // For other usernames, implement your actual authentication logic
        // Here, let's assume a basic authentication for demonstration
        //&& password === 'adminpassword'
        if (username === 'admin' ) {
            res.redirect('/feedbackAdminPage.html'); // Redirect to home page if login is successful
        } else {
            res.redirect('/login.html'); // Redirect back to login page if login fails
        }
    }
});

// Define a route to retrieve data from the database
app.get('/data', (req, res) => {
    client.query('SELECT * FROM public."WashingMachine"')
        .then(result => {
            console.log("Data retrieved successfully:");
            console.log(result.rows);
            res.json(result.rows);
        })
        .catch(error => {
            console.error("Error executing query:", error);
            res.status(500).send('Internal server error');
        });
});

// Define a route to handle toggle requests
app.post('/toggle/:id', (req, res) => {
    const wmId = req.params.id;
    // Assuming you have a function to toggle status in the database
    toggleStatusInDatabase(wmId)
        .then(updatedData => {
            res.json(updatedData); // Send back updated data
        })
        .catch(error => {
            console.error("Error toggling status:", error);
            res.status(500).send('Internal server error');
        });
});

// Function to toggle status in the database
function toggleStatusInDatabase(wmId) {
    // Your logic to toggle status in the database
    // Update the Live_Status column for the given WM_ID
    return new Promise((resolve, reject) => {
        client.query('UPDATE public."WashingMachine" SET "Live_Status" = NOT "Live_Status" WHERE "WM_ID" = $1 RETURNING *', [wmId])
            .then(result => {
                console.log("Status toggled successfully:");
                console.log(result.rows);
                resolve(result.rows);
                
            })
            .catch(error => {
                console.error("Error toggling status in database:", error);
                reject(error);
            });
    });
}

// Handle form submission
app.post('/submitFeedback', (req, res) => {
    // Extract data from the form
    const { studentID, complaint, washingMachineID } = req.body;

    // Set Complaint_Status to "Working on it"
    const complaintStatus = 'Working on it';
    const complaintID = generateComplaintID();
    // Insert the data into the database
    const query = `
    INSERT INTO public."Feedback" ("Complaint", "Complaint_ID", "Complaint_Status", "WM_ID", "Student_ID")
    VALUES ($1, $2, $3, $4, $5)
`;
    const values = [complaint, complaintID, complaintStatus, washingMachineID, studentID];


    client.query(query, values)
        .then(result => {
            console.log("Feedback submitted successfully");
            // Redirect to a new page or refresh the current page
            res.redirect('/feedbackSubmitted.html');
        })
        .catch(err => {
            console.error("Error submitting feedback:", err);
            res.status(500).send('Internal server error');
        });
});


app.get('/feedbacks', (req, res) => {
    client.query('SELECT * FROM public."Feedback"')
        .then(result => {
            console.log("Feedbacks retrieved successfully:");
            console.log(result.rows);
            res.json(result.rows);
        })
        .catch(error => {
            console.error("Error executing query:", error);
            res.status(500).send('Internal server error');
        });
});


// Route to update complaint status
app.post('/updateStatus/:id', (req, res) => {
    const complaintId = req.params.id;
    const { status } = req.body;

    client.query('UPDATE public."Feedback" SET "Complaint_Status" = $1 WHERE "Complaint_ID" = $2', [status, complaintId], (error, result) => {
        if (error) {
            console.error("Error updating complaint status:", error);
            res.status(500).json({ error: "Internal server error" });
        } else {
            res.status(200).send("Complaint status updated successfully");
        }
    });
});



// Fetch data for status table
app.get('/api/status', (req, res) => {
    client.query('SELECT * FROM "Status"', (err, result) => {
        if (err) {
            console.error('Error fetching status data:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(result.rows);
        }
    });
});

app.post('/api/updateStatus', (req, res) => {
    const { machineId, condition, maintenanceDate } = req.body;
    const query = 'UPDATE "Status" SET "Condition" = $1, "Last_Maintainance_Date" = $2 WHERE "WM_ID" = $3';
    const values = [condition, maintenanceDate, machineId];
    client.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.sendStatus(200);
        }
    });
});




function generateComplaintID() {
    // Generate a random number as the complaint ID
    return Math.floor(Math.random() * 1000000); // Adjust range as needed
}

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is listening at port ${port}...`);
});

