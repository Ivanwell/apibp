var cron = require('node-cron');
const { mainBM } = require('./bm_parts_updating/index.js')
const { mainTM } = require('./techno_mir_updating/index.js')
const { mainUTR } = require('./utr_updating/index.js')
const { writeLogs, getTokenUTR, requestToPreparePriceUTR } = require('./common_functions/functions.js')
 
module.exports = () => {  
    cron.schedule('00 05 * * *', async () => {
        try{
            console.log('hello')
            await mainBM()
        }catch(error){
            writeLogs('./scripts/errors.txt', error.message)
        }
   
    }, {
      scheduled: true,
      timezone: "Europe/Kiev"
    });
    
    cron.schedule('46 18 * * *', async () => {
        try{
            const token = await getTokenUTR()
            await mainTM(token.token)
        }catch(error){
            writeLogs('./scripts/errors.txt', error.message)
        }
   
    }, {
      scheduled: true,
      timezone: "Europe/Kiev"
    });
    
    cron.schedule('00 07 * * *', async () => {
        try{
            const brands = [122, 57, 112, 105, 132, 15, 316640, 4, 60, 87, 93, 95, 43, 92, 21, 126, 88, 124, 56, 152, 31839]
            const token = await getTokenUTR()
            await requestToPreparePriceUTR(token.token, brands)
            return 'success'
        }catch(error){
            writeLogs('./scripts/errors.txt', error.message)
        }
   
    }, {
      scheduled: true,
      timezone: "Europe/Kiev"
    });
    
    cron.schedule('05 07 * * *', async () => {
        try{
            const token = await getTokenUTR()
            mainUTR(token.token)
            return 'success'
        }catch(error){
            writeLogs('./scripts/errors.txt', error.message)
        }
   
    }, {
      scheduled: true,
      timezone: "Europe/Kiev"
    });
}