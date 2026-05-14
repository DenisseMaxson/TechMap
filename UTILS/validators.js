// Validaciones técnicas para TechMap
const validateRFC = (rfc) => {
    const regex = /^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z\d]?[0-9A-Z]?$/i;
    return regex.test(rfc);
};

const validateMAC = (mac) => {
    const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return regex.test(mac);
};

const validateIP = (ip) => {
    const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return regex.test(ip);
};

module.exports = { validateRFC, validateMAC, validateIP };