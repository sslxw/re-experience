const express = require('express');
const path = require('path');
const cors = require('cors');
const router = express.Router();
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const compression = require('compression');
const { attachBlogRoutes } = require('./blogRoutes');

const app = express();
const port = Number(process.env.PORT) || 8080;

app.use(cors());
app.use(compression());

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../public')));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

attachBlogRoutes(app);

// Handle GET requests to /api route
app.post('/api/send-email', (req, res) => {
    const { name, company, email, message } = req.body;
    const smtpUser = process.env.CONTACT_SMTP_USER || process.env.FOLIO_EMAIL;
    const smtpPass = process.env.CONTACT_SMTP_PASS || process.env.FOLIO_PASSWORD;
    const mailTo = process.env.CONTACT_TO;
    const mailFrom = process.env.CONTACT_FROM || smtpUser;

    if (!smtpUser || !smtpPass || !mailTo) {
        res.status(503).json({
            error: 'Contact form is not configured on this server.',
        });
        return;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    transporter
        .verify()
        .then(() => {
            transporter
                .sendMail({
                    from: `"${name}" <${mailFrom}>`,
                    to: mailTo,
                    subject: `${name} <${email}> ${
                        company ? `from ${company}` : ''
                    } submitted a contact form`, // Subject line
                    text: `${message}`, // plain text body
                })
                .then((info) => {
                    console.log({ info });
                    res.json({ message: 'success' });
                })
                .catch((e) => {
                    console.error(e);
                    res.status(500).send(e);
                });
        })
        .catch((e) => {
            console.error(e);
            res.status(500).send(e);
        });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is listening on port ${port}`);
});
