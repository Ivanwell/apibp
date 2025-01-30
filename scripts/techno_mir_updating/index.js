const { Item_whole, Item_direct, Link } = require('../../models/models.js')
const { getDate, writeLogs, devideOnChunks, updateAllEndedProducts, createItemWhole, createItemDirect } = require('../common_functions/functions.js')
const { getJsonTechnoMirPrice } = require('../common_functions/get_prices_from_supliers.js')
const mongoose = require("mongoose");
const error_path = './scripts/techno_mir_updating/errors.txt'
const result_path = './scripts/techno_mir_updating/loggs.txt'
const new_art_path = './scripts/techno_mir_updating/new.txt'

async function mainTM(tokenUTR){
    try{
        const jsonPrice = await getJsonTechnoMirPrice();
        writeLogs(result_path, `${new Date()} - починаємо оновлення ТехноМир ${jsonPrice.data.length} шт`)
        updateMyPriceTmNewAll(jsonPrice.data, tokenUTR)
        return 'Started'
    }catch(error){
        writeLogs(error_path, `main ${new Date()} - ${error.message}`)
    }
    
}

async function updateMyPriceTmNewAll (array, tokenUTR) {
    
    try{
        
        const finalDate = getDate()
        const suplierId = 'STOK'
        let newItems = 0;
        let updatedItems = 0;
        let newDirect = 0;
        
        const chunks = devideOnChunks(array)
        
        for (const onePackage of chunks) {
            
            const updating = await updateOneChunkItems(onePackage, suplierId, finalDate, tokenUTR)
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
            writeLogs(error_path, `updateMyPriceTmNewAll  ${new Date()} - ${error.message}`)
        }
    
}

async function updateOneChunkItems(onePackage, suplierId, finalDate, tokenUTR) {
    
    try{
        const promises = onePackage.map(item => updateOneItem(item, suplierId, finalDate, tokenUTR))
    
        const data = Promise.all(promises).then((values) => {
          return(values);
        });
        
        return data
    }catch(error){
        writeLogs(error_path, `updateOneChunkItems ${new Date()} - ${error.message}`)
    }
}

async function updateOneItem(item, suplierId, finalDate, tokenUTR) {
    
    const articleArr = item.code.replace(/[- ./]/g, '').toUpperCase()
    const brandArr = item.brand
    const amountArr = item.quantity
    const priceArr = Math.ceil(+item.price.replace(',','') * 40 * 1.20 + 80)
    const titleArr = item.descriptionUa || item.descriptionRus
        
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
        
        if (amountArr == '') {
            amountArr = 1
        }
        
        try {
             const updating = await Item_direct.findOneAndUpdate(filter, update, { new : true})
    
             if (updating === null) {
                
                const isItemCreated = await Item_whole.findOne({
                    article : articleArr, brandShort : brandArr.toUpperCase().slice(0,5).replace(/[- ./]/g, '')
                })
                
                if (!isItemCreated) {
                    
                    const newItemWhole = await createItemWhole(articleArr, brandArr, titleArr, error_path, tokenUTR)
                    
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

module.exports = { mainTM }
