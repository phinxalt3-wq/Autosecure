module.exports = (link) => {
    try {

        const urlObj = new URL(link);
        

        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return false;  
        }
        
        if (!urlObj.hostname) {
            return false; 
        }
        

        if (!urlObj.hostname.includes('.') && urlObj.hostname !== 'localhost') {
            return false;  
        }
        
        return true;
    } catch (err) {
        return false;  
    }
};