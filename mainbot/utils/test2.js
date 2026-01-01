
import('./api.js').then(({ api }) => {
    api().then(apiKey => {
        console.log('Returned API Key:', apiKey);
    }).catch(console.error);
});
