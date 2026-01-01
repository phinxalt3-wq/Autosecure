module.exports = async function getfamilydata(client) {
    try {
        const resp = await client.get(
            "https://account.microsoft.com/home/api/family/family-summary",
            {
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            }
        );

        const data = resp.data;
        const members = (typeof data === 'object' && Array.isArray(data.members)) ? data.members : [];

        if (members.length === 0) {
            return "No members found";
        }

        const memberList = members.map(m => {
            const name = m.displayName || "Unknown";
            const relation = m.isChild ? "child" : "parent";
            return `${name} [${relation}]`;
        });

        return `Total members: ${members.length}\nMembers:\n${memberList.join("\n")}`;
    } catch (error) {
        return "Error while finding members.";
    }
}
