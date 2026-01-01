module.exports = async function userpermissions() {
    const userperms = {
   //     editsettings: { permission: 'editsettings', description: "Edit Settings" }, // Deprecated
     //   editfeatures: { permission: 'editfeatures', description: "Edit Features" }, // Deprecated
     //   responsesOnly: { permission: 'editresponses', description: "Edit Responses" }, // Deprecated
        editbuttons: { permission: 'editbuttons', description: "Edit Buttons" },
        editmodals: { permission: 'editmodals', description: "Edit Modals" },
        editembeds: { permission: 'editembeds', description: "Edit Embeds" },
        editclaiming: { permission: 'editclaiming', description: "Edit Claiming" },
        usestatsbutton: { permission: 'usestatsbutton', description: "Use Stats Buttons" },
        usedmbuttons: { permission: 'usedmbuttons', description: "Use DM Buttons" },
        editbot: { permission: 'editbot', description: "Edit Bot" },
        editphisher: { permission: 'editphisher', description: "Edit Phisher" },
        editautosecure: { permission: 'editautosecure', description: "Edit Autosecure" },
        editblacklist: { permission: 'editblacklist', description: "Edit Blacklist" },
        editpresets: { permission: 'editpresets', description: "Edit Presets"},
        sendembeds: { permission: 'sendembeds', description: "Send Embeds & Set channels"}
    };

    return [userperms];
}
