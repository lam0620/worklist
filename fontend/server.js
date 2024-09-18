const express = require('express');
const app = express();
const PORT = 3001;

// Dữ liệu giả
const orderDay = [
    { doctor_no: "D001", doctor_name: "Dr. A", count: 10 },
    { doctor_no: "D002", doctor_name: "Dr. B", count: 15 },
    { doctor_no: "D003", doctor_name: "Dr. C", count: 20 },
    { doctor_no: "D004", doctor_name: "Dr. D", count: 25 },
    { doctor_no: "D005", doctor_name: "Dr. E", count: 30 },
    { doctor_no: "D006", doctor_name: "Dr. F", count: 18 },
    { doctor_no: "D007", doctor_name: "Dr. G", count: 22 },
    { doctor_no: "D008", doctor_name: "Dr. H", count: 28 }
  ];
  
  const orderYear = [
    { month: 1, count: 100 },
    { month: 2, count: 120 },
    { month: 3, count: 130 },
    { month: 4, count: 140 },
    { month: 5, count: 110 },
    { month: 6, count: 115 },
    { month: 7, count: 125 },
    { month: 8, count: 135 },
    { month: 9, count: 140 },
    { month: 10, count: 150 },
    { month: 11, count: 160 },
    { month: 12, count: 170 }
  ];
  
  const resultDay = [
    { doctor_no: "D001", doctor_name: "Dr. A", count: 32 },
    { doctor_no: "D002", doctor_name: "Dr. B", count: 43 },
    { doctor_no: "D003", doctor_name: "Dr. C", count: 11 },
    { doctor_no: "D004", doctor_name: "Dr. D", count: 23 },
    { doctor_no: "D005", doctor_name: "Dr. E", count: 11 },
    { doctor_no: "D006", doctor_name: "Dr. F", count: 54 },
    { doctor_no: "D007", doctor_name: "Dr. G", count: 34 },
    { doctor_no: "D008", doctor_name: "Dr. H", count: 5 }
  ];
  
  const resultYear = [
    { month: 1, count: 90 },
    { month: 2, count: 110 },
    { month: 3, count: 120 },
    { month: 4, count: 130 },
    { month: 5, count: 150 },
    { month: 6, count: 180 },
    { month: 7, count: 140 },
    { month: 8, count: 132 },
    { month: 9, count: 90 },
    { month: 10, count: 150 },
    { month: 11, count: 55 },
    { month: 12, count: 29 }
  ];
  
  const imageYear = [
    { month: 1, count: 23 },
    { month: 2, count: 232 },
    { month: 3, count: 123 },
    { month: 4, count: 240 },
    { month: 5, count: 87 },
    { month: 6, count: 211 },
    { month: 7, count: 100 },
    { month: 8, count: 167 },
    { month: 9, count: 255 },
    { month: 10, count: 22 },
    { month: 11, count: 190 },
    { month: 12, count: 70 }
  ];

var cors = require('cors');
app.use(cors());
// API giả
app.get('/api/stats/order-doctors/:period', (req, res) => {
  const period = req.params.period;
  if (['today', '1week', '1month'].includes(period)) {
    res.json(orderDay);
  }else if(['year'].includes(period)) {
    res.json(orderYear);
    }else{
        res.status(400).send('Invalid period');
    } 
  }
);
app.get('/api/stats/orders/:period', (req, res) => {
  const period = req.params.period;
  if(['year'].includes(period)){
    res.json(orderYear);
  }else{
    res.status(400).send('Invalid period');
  }
  }
);
app.get('/api/stats/report-doctors/:period', (req, res) => {
    const period = req.params.period;
    if (['today', '1week', '1month'].includes(period)) {
      res.json(resultDay);
    }else{
          res.status(400).send('Invalid period');
    }
  }
);
app.get('/api/stats/reports/:period', (req, res) => {
  const period = req.params.period;
  if(['year'].includes(period)){
    res.json(resultYear);
  }else{
    res.status(400).send('Invalid period');
  }
  }
);
  app.get('/api/stats/studies/:period', (req, res) => {
    const period = req.params.period;
    if (['year'].includes(period)) {
      res.json(imageYear);
    }
      else{
          res.status(400).send('Invalid period');
    }
  }
);


// Khởi động server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
