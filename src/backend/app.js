const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const apiRoutes = require('./routes/apiRoutes');

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors({
  origin: 'https://howsthemarket.xyz',
}));

app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Server running on https://howsthemarket.xyz`);
});

