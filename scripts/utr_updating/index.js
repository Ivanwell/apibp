const { Item_whole, Item_direct, Link } = require('../../models/models.js')
const { getDate, writeLogs, devideOnChunks, updateAllEndedProducts, createItemWhole, createItemDirect } = require('../common_functions/functions.js')
const { getJsonUTR } = require('../common_functions/get_prices_from_supliers.js')
const mongoose = require("mongoose");
const error_path = './scripts/utr_updating/errors.txt'
const result_path = './scripts/utr_updating/loggs.txt'
const new_art_path = './scripts/utr_updating/new.txt'

async function mainUTR(token){
    try{
            const price = await getJsonUTR(token)
            writeLogs(result_path, `${new Date()} - починаємо оновлення Юніктрейд ${price.length} шт`)
            updateMyPriceUtrNewAll(price, token)
            return 'Started'
    }catch(error){
        writeLogs(error_path, `main ${new Date()} - ${error.message}`)
    }
    
}

async function updateMyPriceUtrNewAll (array, token) {
    
    try{
        
        const finalDate = getDate()
        const suplierId = 'UNTR'
        let newItems = 0;
        let updatedItems = 0;
        let newDirect = 0;
        
        const chunks = devideOnChunks(array)
        
        for (const onePackage of chunks) {
            
            const updating = await updateOneChunkItems(onePackage, suplierId, finalDate, token)
            var map = updating.reduce(function(prev, cur) {
              prev[cur] = (prev[cur] || 0) + 1;
              return prev;
            }, {});
            
            if(map['new item']){
                newItems = newItems + map['new item']
            }
                
            if (map['old updated']) {
                updatedItems = updatedItems + map['old updated']
            }
                
            if (map['new direct']) {
                newDirect = newDirect + map['new direct']
            }
        }
        
        await updateAllEndedProducts(suplierId, finalDate)
        
        writeLogs(result_path ,`${new Date()} Оновлено ТехноМир. Результати : оновлено : ${updatedItems}, створено нових : ${newItems}, створено локальних : ${newDirect}`)
        
        }catch(error){
            writeLogs(error_path, `updateMyPriceUTNewAll  ${new Date()} - ${error.message}`)
        }
    
}

async function updateOneChunkItems(onePackage, suplierId, finalDate, token) {
    
    try{
        const promises = onePackage.map(item => updateOneItem(item, suplierId, finalDate, token))
    
        const data = Promise.all(promises).then((values) => {
          return(values);
        });
        
        return data
    }catch(error){
        writeLogs(error_path, `updateOneChunkItems ${new Date()} - ${error.message}`)
    }
}

async function updateOneItem(item, suplierId, finalDate, token) {
    
    const articleArr = item.Артикул.replace(/[- ./]/g, '').toUpperCase()
    let brandArr = item.Бренд
    let amountArr = item['Львівська обл.']
    const priceArr = Math.ceil(+item.Ціна* 1.2)
    const titleArr = item.Найменування
    
        
    if ( amountArr == '0') {
        amountArr = item['КИЇВ-2']
    }
        
    if ( amountArr == '0') {
        amountArr = 1
    }
        
    if (brandArr == 'NTN-SNR') {
        brandArr = 'SNR'
    }
     
    if (amountArr == '') {
        amountArr = 1
    }
        
    let filter = {
        article : articleArr,
        suplierID : suplierId,
        brand : brandArr.toUpperCase().slice(0,5).replace(/[- ./]/g, '')
    }

    let update = {
        amount : amountArr,
        price : priceArr,
        lastDate : finalDate
    }
        
        try {
             const updating = await Item_direct.findOneAndUpdate(filter, update, { new : true})
    
             if (updating === null) {
                
                const isItemCreated = await Item_whole.findOne({
                    article : articleArr, brandShort : brandArr.toUpperCase().slice(0,5).replace(/[- ./]/g, '')
                })
                
                if (!isItemCreated) {
                    
                    const newItemWhole = await createItemWhole(articleArr, brandArr, titleArr, error_path, token)
                    
                    const newItemDirect = await createItemDirect(articleArr, brandArr, suplierId, finalDate, priceArr, amountArr, error_path)
                    
                    newItemWhole.supliers.push(newItemDirect)
                    await newItemWhole.save();
                    
                    newItemDirect.itemWhole = newItemWhole
                    await newItemDirect.save();
                    
                    writeLogs(new_art_path, `${articleArr}`)
                    
                    return 'new item'
                    
                } else {
                    const newItemDirect = await createItemDirect(articleArr, brandArr, suplierId, finalDate, priceArr, amountArr, error_path)
                    
                    isItemCreated.supliers.push(newItemDirect)
                    await isItemCreated.save();
                    
                    newItemDirect.itemWhole = isItemCreated
                    await newItemDirect.save();
                    
                    writeLogs(new_art_path, `Локальний ${articleArr}`)
                    
                    return 'new direct'
                }
            } else {
                return 'old updated'
            }   
        } catch (error){
            writeLogs(error_path, `${new Date()} ${articleArr} ${brandArr}- ${error.message}`)
        }
}

module.exports = { mainUTR }
