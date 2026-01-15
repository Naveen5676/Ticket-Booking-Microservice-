const generateSeats = (totalSeats) => {
  const seats = [];

  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

  const seatPerRow = Math.ceil(totalSeats / rows.length);

  let seatCount = 0;

  for (let row of rows) {
    for (let num = 1; num <= seatsPerRow; num++) {
      if (seatCount >= totalSeats) break;

      seats.push({
        seatNumber: `${row}${num}`,
        status: "available", // available, locked, booked , cancelled
      });

      seatCount++;
    }
    if (seatCount >= totalSeats) break;
  }

  return seats;
};

module.exports = {
  generateSeats,
};
