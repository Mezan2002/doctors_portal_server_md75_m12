// require start
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
// require end

// middlewears start
app.use(cors());
app.use(express.json());
// middlewears end

// mongo DB setup start
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2ahck7i.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// mongo DB run function start
const run = async () => {
  try {
    // collctions start

    // appointment collection start
    const appointmentOptionsCollection = client
      .db("doctorsPortal")
      .collection("appointmentOptions");
    // appointment collection end

    // bookings collection start
    const bookingsCollection = client
      .db("doctorsPortal")
      .collection("bookings");
    // bookings collection end

    // collctions end

    // get all appointment options API start
    app.get("/appointmentOptions", async (req, res) => {
      const date = req.query.date;
      const query = {};
      const cursor = appointmentOptionsCollection.find(query);
      const appointmentOptions = await cursor.toArray();
      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();
      appointmentOptions.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.appointmentTakingFor === option.name
        );
        const bookedSlots = optionBooked.map((book) => book.timeOfAppointment);
        const remainingSlots = option.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        option.slots = remainingSlots;
      });
      res.send(appointmentOptions);
    });
    // get all appointment options API end

    // post bookings API start
    app.post("/bookings", async (req, res) => {
      const bookings = req.body;
      const result = await bookingsCollection.insertOne(bookings);
      const query = {
        appointmentDate: bookings.appointmentDate,
        appointmentTakingFor: bookings.appointmentTakingFor,
        email: bookings.email,
      };
      const alreadyBooked = await bookingsCollection.find(query).toArray();
      if (alreadyBooked.length > 1) {
        const message = `You have already booked an appointment on, ${bookings.appointmentDate}`;
        return res.send({ acknowledged: false, message });
      }

      res.send(result);
    });
    // post bookings API end
  } finally {
  }
};

run().catch((error) => console.log(error));

// mongo DB run function end

// mongo DB setup end

// basic setup start

app.get("/", (req, res) => {
  res.send("Doctors Portal is Running");
});

app.listen(port, () => {
  console.log(`Doctors Portal is Running on Port ${port}`);
});

// basic setup end
