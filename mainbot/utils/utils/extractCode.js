function extractCode(body) {
    // Primary: space followed by 6 or 7 digits
    const primaryRegex = / [0-9]{6,7}/;
    const backupRegex1 = /:[0-9]{6,7}/;
    const fallbackRegex = /\b(?!\S*@)[0-9]{6,7}\b/; // 6-7 digits not preceded by part of an email

    let match = body.match(primaryRegex);

    if (!match) {
        match = body.match(backupRegex1);
    }

    if (!match) {
        match = body.match(fallbackRegex);
    }

    if (match && match[0]) {
        const code = match[0].replace(/[^0-9]/g, ""); // Strip space or colon, keep only digits
        console.log(`Got a code: ${code}`);
        return code;
    }

    return null;
}

module.exports = {
    extractCode,
};
