const calculateDateOffset = (offset) => {

    const today = new Date();

    today.setDate(today.getDate() + offset - 1); // Adjust the date by the offset

    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);
  
    return `${month}/${day}`;

};

module.exports = { calculateDateOffset };