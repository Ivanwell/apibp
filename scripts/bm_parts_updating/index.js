const csv = require('csvtojson');
const mongoose = require("mongoose");
const { Item_whole, Category, Item_direct, Link } = require('../../models/models.js')
const { getDate, writeLogs, getUuid, createOnlyLinkInBM, getFirstImageForItemFromBM, getCategoryByUuid, devideOnChunks, updateAllEndedProducts } = require('../common_functions/functions.js')
const { getCsvPriceFromBM } = require('../common_functions/get_prices_from_supliers.js')
const error_path = './scripts/bm_parts_updating/errors.txt'
const result_path = './scripts/bm_parts_updating/loggs.txt'
const new_art_path = './scripts/bm_parts_updating/new.txt'

async function mainBM(){
    try{
        const csvPrice = await getCsvPriceFromBM()
        const jsonPrice = await csv().fromString(csvPrice);
        updateMyPriceBMPANewAll(jsonPrice)
        return 'Started'
    }catch(error){
        writeLogs(error_path, `main ${new Date()} - ${error.message}`)
    }
    
}

async function updateMyPriceBMPANewAll (array) {
    
    try{
        writeLogs(result_path ,`${new Date()} Починаємо оновлення BM Parts`)
        
        const finalDate = getDate()
        let newItems = 0;
        let updatedItems = 0;
        let newDirect = 0;
        const suplierId = 'BMPA'
        
        const chunks = devideOnChunks(array)
    
        for (const oneChunk of chunks) {
            
          const updating = await updateOneChunkItemsBM(oneChunk, suplierId, finalDate)
          
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
        
        writeLogs(result_path ,`${new Date()} Оновлено BM Parts. Результати : оновлено : ${updatedItems}, створено нових : ${newItems}, створено локальних : ${newDirect}`)
        
        return 'done'
        
        }catch(error){
            writeLogs(error_path, `Головна функція  ${new Date()} - ${error.message}`)
        }

}

async function updateOneChunkItemsBM(onePackage, suplierId, finalDate) {
    try{
        const promises = onePackage.map(item => updateOneItemBM(item, suplierId, finalDate))
    
        const data = Promise.all(promises).then((values) => {
          return(values);
        });
        
        return data
    }catch(error) {
        writeLogs(error_path, `updateOneChunkItemsBM ${new Date()} - ${error.message}`)
    }
    
}

async function updateOneItemBM (item, suplierId, finalDate) {
         
        const articleArr = item.Артикул.replace(/[- ./]/g, '').toUpperCase()
        let brandArr = item.Бренд
        let amountArr = item['Луцьк ДАГ']
        const priceArr = Math.ceil(+item['Ціна ГРН']* 1.2)
        const titleArr = item.Назва

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
                    
                    const newItemWhole = await createItemWholeNewBM(articleArr, brandArr, titleArr)
                    
                    const newItemDirect = await createItemDirectNewBM(articleArr, brandArr, suplierId, finalDate, priceArr, amountArr)
                    
                    newItemWhole.supliers.push(newItemDirect)
                    await newItemWhole.save();
                    
                    newItemDirect.itemWhole = newItemWhole
                    await newItemDirect.save();
                    
                    return "new item"
                    
                } else {
                    
                    const newItemDirect = await createItemDirectNewBM(articleArr, brandArr, suplierId, finalDate, priceArr, amountArr)
                    
                    isItemCreated.supliers.push(newItemDirect)
                    await isItemCreated.save();
                    
                    newItemDirect.itemWhole = isItemCreated
                    await newItemDirect.save();
                    
                    const updatingTitleAndImageFromBm = await updateTitleAndImageFromBm(articleArr, brandArr, titleArr)
                    
                    return "new direct"
                }
            } else {
                return "old updated"
            }   
        } catch (error){
            writeLogs(error_path, `updateOneItemBM ${articleArr} ${brandArr} ${new Date()} - ${error.message}`)
        }
}

async function createItemWholeNewBM(articleArr, brandArr, title) {
    
    try {
        const searchImage = await getFirstImageForItemFromBM(articleArr, brandArr, error_path)
    
        const newItemWhole = new Item_whole({
            _id: new mongoose.Types.ObjectId(),
            article: articleArr,
            brand: brandArr.toUpperCase(),
            title: title,
            image: searchImage,
            categories:[],
            brandShort: brandArr
              .toUpperCase()
              .slice(0, 5)
              .replace(/[- ./]/g, ''),
        })
        
        await newItemWhole.save()
        
        writeLogs(new_art_path, `${articleArr}`)
        
        const uuid = await getUuid(articleArr, brandArr)
        const category = await getCategoryByUuid(uuid)
        
        if (category) {
                        
            const devided = category.nodes.split('/')
            const catName = devided[devided.length-1]
            const findedCat = await Category.findOne({name :  catName});
                        
            newItemWhole.categories.push(findedCat)
                        
            await newItemWhole.updateOne({categoryName : catName})
        }
        
            const createdLink = await createOnlyLinkInBM(title, brandArr, articleArr, error_path)
            newItemWhole.link.push(createdLink)

            return await newItemWhole.save()
    }catch(error){
        writeLogs(error_path, `createItemWholeNewBM  ${articleArr} ${brandArr} ${new Date()} - ${error.message}`)
    }
     
}

async function createItemDirectNewBM(articleArr, brandArr, suplierId, finalDate, priceArr, amountArr) {
    
    try {
            const newItemDirect = new Item_direct({
              article: articleArr,
              suplierID: suplierId,
              price: priceArr,
              amount: amountArr,
              lastDate: finalDate,
              _id: new mongoose.Types.ObjectId(),
              brand: brandArr
                .toUpperCase()
                .slice(0, 5)
                .replace(/[- ./]/g, ''),
            })
            
            writeLogs(new_art_path, `Локальний ${articleArr}`)
            
            return await newItemDirect.save()
            
    }catch(error){
        writeLogs(error_path, `createItemDirectNewBM  ${articleArr} ${brandArr} ${new Date()} - ${error.message}`)
    }
}

async function updateTitleAndImageFromBm(articleArr, brandArr, title) {
    
    try{
        const bmImage = await getFirstImageForItemFromBM(articleArr, brandArr, error_path)
    
        let update = {title : title}
        
        if (bmImage != '-') {
            update = {title : title, image : bmImage} 
        }
                    
        const updating = await Item_whole.findOneAndUpdate({article : articleArr, brandShort : brandArr.toUpperCase().slice(0,5).replace(/[- ./]/g, '')}, update, { new : true})
        
        const uuid = await getUuid(articleArr, brandArr)
        const category = await getCategoryByUuid(uuid)
        
        const newItemWhole = await Item_whole.findOne({article : articleArr, brandShort : brandArr.toUpperCase().slice(0,5).replace(/[- ./]/g, '')})
        
        if (category) {
                        
            const devided = category.nodes.split('/')
            const catName = devided[devided.length-1]
            
            const findedCat = await Category.findOne({name :  catName});
                        
            newItemWhole.categories.push(findedCat)
                        
            await newItemWhole.updateOne({categoryName : catName})
        }
        
            const createdLink = await createOnlyLinkInBM(title, brandArr, articleArr, error_path)
            newItemWhole.link.push(createdLink)
            
    }catch(error){
        writeLogs(error_path, `updateTitleAndImageFromBm ${articleArr} ${brandArr} ${new Date()} - ${error.message}` )
    }
              
}

module.exports = { mainBM }