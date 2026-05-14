const formatToSQLDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Convierte a YYYY-MM-DD
};

module.exports = { formatToSQLDate };