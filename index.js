import express from 'express'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node';

let app = express();

const defaultData = { travelTrackerData:[] };
const adapter = new JSONFile('db.json');
const db = new Low(adapter, defaultData)

let travelData = [];

app.use('/', express.static('public'));

app.use(express.json());

app.post('/activity', (req, res)=>{
    console.log(req.body);
    let trips = req.body;
    // let obj = {
    //     from: req.body.from,
    //     to: req.body.to,
    //     startDate: req.body.startDate,
    //     endDate: req.body.endDate,
    // }
    // travelData.push(obj);
    // console.log('Updated travelData:', travelData); // Debugging
    // res.json({ task: "success", data: obj }); // Respond with success message

     // Add each trip to the database
     trips.forEach((trip) => {
        const { from, to, startDate, endDate } = trip;
        if (from && to && startDate && endDate) { // Validate fields
            db.data.travelTrackerData.push(trip);
        } else {
            console.error('Invalid trip data:', trip);
        }
    });

    // db.data.travelTrackerData.push(obj);
    db.write()
    .then(() => {
       res.json({ task: "successful" });
   });
})



app.listen(3000, ()=>{
    console.log('listening at localhost:3000');
})