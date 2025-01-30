const axios = require("axios");
var fs = require('fs');
const mongoose = require("mongoose");
const { Link, Item_direct, Category, Item_whole } = require('../../models/models.js')
const { alphavet } = require('./alphavet.js')

function getDate () {

    const date = new Date()
    const year = date.getFullYear()
    let month = date.getMonth() + 1
        if (month < 10) {
          month = `0${month}`
        }
        let day = date.getDate()
        if (day < 10) {
          day = `0${day}`
        }
    const finalDate = `${day}.${month}.${year}`
    
    return finalDate

}

function writeLogs (address ,data) {
    fs.appendFile(address, data+ "\n", err => {
      if (err) {
        console.error(err);
      }
    })
}

async function getTokenUTR () {
  return new Promise(async (resolve, reject)=> {
    
  const options = {
    method: "POST",
    url: "https://order24-api.utr.ua/api/login_check",
    data: {
      email: "lviv08@gmail.com",
      password: "henry1414",
      browser_fingerprint: "10",
    },
    headers: { "Content-Type": "application/json" },
  };

  axios
    .request(options)
    .then((response) => {
        resolve(response.data);
    })

    .catch((error) => {
      console.log(error);
    });
    
    })
}

async function requestToPreparePriceUTR (token, brandsIds) {
    
    return new Promise(async (resolve, reject)=> {

  const options = {
    method: "POST",
    url: "https://order24-api.utr.ua/pricelists/export-request",
    data: {
      "brandsId": brandsIds,
      "format":"json",
      "utrArticle":false,
      "inStock":true
    },
    headers: { "Content-Type": "application/json" ,
    Authorization: "Bearer " + token},
  };

  axios
    .request(options)
    .then((response) => {
        resolve(response.data);
    })

    .catch((error) => {
      resolve(error);
    });
    
    })
}

async function getUuid (art, brand) {
    
    return new Promise((resolve, reject)=> {

  const options = {
    method: "GET",
    url: `https://api.bm.parts/search/products?q=${art}&products_as=arr&search_mode=strict`,
    
    headers: { 
    Authorization: "4b17c6ab-d276-43cb-a6bf-bd041bf7bec8.1oR0k6llb6Wpim03FgaovxLlNhE"},
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
  };

  axios
    .request(options)
    .then((response) => {
       if (response.data.products.length < 1) {
            resolve(null)
        } else {
            let finaldata
            if (!brand) {
                finaldata = response.data.products.find(
                  product =>
                    product.article.replace(/[- /]/g, '') ===
                    art.replace(/[- /]/g, '')
                )
              } else {
                finaldata = response.data.products.find(
                  product =>
                    product.article.replace(/[- /]/g, '') ===
                      art.replace(/[- /]/g, '') && product.brand === brand
                )
              }

            resolve(finaldata.uuid)
        }
    }
     ).catch((error) => {
      resolve(null)
    });
    })
}

async function createOnlyLinkInBM (title, brand, article, errorAddress) {
    
    try{
        const stringArr = title.split(' ').slice(0, 8)
        const string = stringArr.join(' ') + ' ' + brand.replace(' ', '-') + ' ' + article
        let step = 0
        let newString = ''
        while (step < string.length) {
          let newChart = alphavet[string[step].toLowerCase()]
          if (newChart === undefined) {
            newChart = string[step].toLowerCase()
          }
          newString = newString + newChart
          step++
        }
        const finalUrl = newString.split(' ')
        const finalfinal = finalUrl.join('-')
        const newLink = new Link({
            _id : new mongoose.Types.ObjectId(),
            link : finalfinal
        }) 
        
        return await newLink.save();
    }catch(error){
        writeLogs(errorAddress, `createOnlyLinkInBM ${article} ${brand}  ${new Date()} - ${error.message}`)
    }
  
   
}

async function getFirstImageForItemFromBM (art, brand, errorAddress) {

    return new Promise((resolve, reject)=> {
                const options = {
    method: "GET",
    url: `https://api.bm.parts/search/products?q=${art}&products_as=arr`,
    
    headers: { 
    Authorization: "4b17c6ab-d276-43cb-a6bf-bd041bf7bec8.1oR0k6llb6Wpim03FgaovxLlNhE"},
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
  };

  axios
    .request(options)
    .then((response) => {

      const finaldata = response.data.products.find(
          product =>
            product.article.replace(/[- ./]/g, '') === art.replace(/[- ./]/g, '') && product.brand.toUpperCase().slice(0,5).replace(/[- ./]/g, '') === brand.toUpperCase().slice(0,5).replace(/[- ./]/g, '')
        )
    
        if (!finaldata) {
          resolve('-')
        } else {
            
        const img1 = finaldata.default_image.slice(5).replace(/[&\/\\]/g, '/')
        
        let img = 'https://cdn.bm.parts/photo/' + img1
    
        if (img === 'https://cdn.bm.parts/photos/' || img ==='https://cdn.bm.parts/photo/') {
          resolve('-')
        }
          resolve(img)
        }
    })
      .catch((error) => {
      writeLogs(errorAddress, `getFirstImageForItemFromBM ${art} ${brand} ${new Date()}- ${error.message}`);
    });
})
    .catch(error => {
        writeLogs(errorAddress, `getFirstImageForItemFromBM ${art} ${brand} ${new Date()}- ${error.message}`)
    })
}

async function getCategoryByUuid (uuid) {

    return new Promise((resolve, reject)=> {
                const options = {
    method: "GET",
    url: `https://api.bm.parts/product/${uuid}?oe=full`,
    
    headers: { 
    Authorization: "4b17c6ab-d276-43cb-a6bf-bd041bf7bec8.1oR0k6llb6Wpim03FgaovxLlNhE"},
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
  };

  axios
    .request(options)
    .then((response) => {
        if (!response.data) {
            resolve(null)
        } else {
        const data = {
            nodes : response.data.product.nodes,
            brand : response.data.product.brand
        }
            resolve(data)
        }
      }
      ).catch((error) => {
      resolve(null);
    })
})
}

function devideOnChunks (array) {
        
        const chunkSize = 20;
        const chunks = [];
        
        for (let i = 0; i < array.length; i += chunkSize) {
          const chunk = array.slice(i, i + chunkSize);
          chunks.push(chunk);
        }
        
        return chunks
}

async function searchImageInAllSupliers (art, brand, error_path, token) {
    
    try {
        
        let data = await getFirstImageAndTitleForItemFromBM(art, brand, error_path);
    
        if (data?.title && !data.image) {
            
            const newImageFromUTR = await getFirstImageForItemFromUTR(art, token, error_path)
            
            if (newImageFromUTR) {
                return ({title : data.title, image : newImageFromUTR})
            }
            
            const newImage = await getFirstImageForItemFromTM(art, brand, error_path)
            
            return ({title : data.title, image : newImage})
            
            } else if (!data) {
                
                const newImageFromUTR = await getFirstImageForItemFromUTR(art, token, error_path)
            
                if (newImageFromUTR) {
                    return ({title : null, image : newImageFromUTR})
                }
                
                const newImage = await getFirstImageForItemFromTM(art, brand, error_path)
             
                return ({title : null, image : newImage})
               
            } else if (data?.title && data?.image) {
                return (data)
            }
    } catch (error) {
       writeLogs(error_path, `searchImageInAllSupliers  ${art} ${brand} ${new Date()} - ${error.message}`)
    }
    
}

async function getFirstImageAndTitleForItemFromBM (art, brand, errorAddress) {

    return new Promise((resolve, reject)=> {
                const options = {
    method: "GET",
    url: `https://api.bm.parts/search/products?q=${art}&products_as=arr`,
    
    headers: { 
    Authorization: "4b17c6ab-d276-43cb-a6bf-bd041bf7bec8.1oR0k6llb6Wpim03FgaovxLlNhE"},
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
  };

  axios
    .request(options)
    .then((response) => {

      const finaldata = response.data.products.find(
          product =>
            product.article.replace(/[- ./]/g, '') === art.replace(/[- ./]/g, '') && product.brand.toUpperCase().slice(0,5).replace(/[- ./]/g, '') === brand.toUpperCase().slice(0,5).replace(/[- ./]/g, '')
        )
    
        if (!finaldata) {
          resolve(null)
        } else {
            
        const img1 = finaldata.default_image.slice(5).replace(/[&\/\\]/g, '/')
        
        let img = 'https://cdn.bm.parts/photo/' + img1
    
        if (img === 'https://cdn.bm.parts/photos/' || img ==='https://cdn.bm.parts/photo/') {
          resolve({image : null, title : finaldata.name})
        }
          resolve({image : img, title : finaldata.name})
        }
    })
      .catch((error) => {
      writeLogs(errorAddress, `getFirstImageAndTitleForItemFromBM ${art} ${brand} ${new Date()}- ${error.message}`);
    });
})
    .catch(error => {
        writeLogs(errorAddress, `getFirstImageAndTitleForItemFromBM ${art} ${brand} ${new Date()}- ${error.message}`)
    })
}

async function getFirstImageForItemFromTM(art, brand, error_path) {
    
    try {
            const brandID = await getIdBrandTechnoMir(art, brand, error_path);
            if (!brandID) {
                return ('-')
            }
            const image = await getImageTechnoMir(art, brandID, error_path);
            return (image)
            
    } catch (error) {
        writeLogs(error_path, `getFirstImageForItemFromTM  ${art} ${brand} ${new Date()} - ${error.message}`)
    }
}

async function getFirstImageForItemFromUTR (art, token, error_path) {

    return new Promise((resolve, reject)=> {
        const options = {
        method: "GET",
        url: `https://order24-api.utr.ua/api/search/${art}?info=1`,
        headers: { Authorization: "Bearer " + token },
      };

      axios.request(options).then((response) => {
        
        if (
          typeof response.data.details[0] == "undefined"
        ) {
          resolve(null);
        } else {
            const image = response.data.details[0].images[0]?.fullImagePath;
            if (typeof image == "undefined")
          {resolve(null)} else {
              resolve(image)
          }
        }
      });
    })
      .catch((error) => {
          writeLogs(error_path, `getFirstImageForItemFromUTR  ${art} ${new Date()} - ${error.message}`)
    });
}

async function getIdBrandTechnoMir(article, brand, error_path) {
    return new Promise((resolve, reject)=> {
        const options = {
    method: "POST",
    url: "https://api.tehnomir.com.ua/info/getBrandsByCode",
    data: {
      apiToken: "jLiA0DZd9LwG6K75xXpfMoZX8t3L7SsO",
      code: article,
    },
    headers: { "Content-Type": "application/json" },
  };
  
  axios.request(options).then((response) => {
    if (typeof response.data.data[0] == "undefined") {
      resolve(null)
    } else {
    const rightBrand = response.data.data.find(branding => branding.brand.toUpperCase().slice(0,5).replace(/[- ./]/g, '') == brand.toUpperCase().slice(0,5).replace(/[- ./]/g, ''))
    if (rightBrand) {
        resolve(rightBrand.brandId)
    } else {
        resolve (null)
    }
    }
  })
    })
    .catch(error => {
        writeLogs(error_path, `getIdBrandTechnoMir  ${article} ${brand} ${new Date()} - ${error.message}`)
    })

}

async function getImageTechnoMir(article, brandId, error_path) {
    return new Promise((resolve, reject)=> {
        const options1 = {
        method: "POST",
        url: "https://api.tehnomir.com.ua/info/getProductInfo",
        data: {
          apiToken: "jLiA0DZd9LwG6K75xXpfMoZX8t3L7SsO",
          brandId: brandId,
          code: article,
        },
        headers: { "Content-Type": "application/json" },
      };
    
      axios.request(options1).then((response1) => {
        
        if(response1.data.data?.images === undefined || response1.data.data?.images[0] === undefined )
         {resolve('-')} else {resolve(response1.data.data.images[0].image)} 
      })
    })
    .catch(error => {
        writeLogs(error_path, `getImageTechnoMir  ${article} ${brandId} ${new Date()} - ${error.message}`)
    })

}

async function updateAllEndedProducts(suplierId, finalDate){
    const deleting = await Item_direct.updateMany({suplierID : suplierId, lastDate
     : {"$ne" : finalDate}}, { amount : 0 });
}

async function createItemWhole(articleArr, brandArr, title, error_path, token) {
    
    try {
        
        const searchImage = await searchImageInAllSupliers(articleArr, brandArr, error_path, token)
    
        const newItemWhole = new Item_whole({
            _id: new mongoose.Types.ObjectId(),
            article: articleArr,
            brand: brandArr.toUpperCase(),
            title: searchImage?.title || title,
            image: searchImage.image,
            categories:[],
            brandShort: brandArr
              .toUpperCase()
              .slice(0, 5)
              .replace(/[- ./]/g, ''),
        })
        
        await newItemWhole.save()
        
        if (searchImage.title) {
            const uuid = await getUuid(articleArr, brandArr)
            const category = await getCategoryByUuid(uuid)
            
            if (category) {
                            
                const devided = category.nodes.split('/')
                const catName = devided[devided.length-1]
                const findedCat = await Category.findOne({name :  catName});
                            
                newItemWhole.categories.push(findedCat)
                            
                await newItemWhole.updateOne({categoryName : catName})
            }
            writeLogs(error_path, `ПОВНИЙ ЗБІГ  ${articleArr} ${brandArr}`)
        }
        
            const createdLink = await createOnlyLinkInBM(searchImage.title || title, brandArr, articleArr, error_path)
            newItemWhole.link.push(createdLink)

            return await newItemWhole.save()
    }catch(error){
        writeLogs(error_path, `createItemWhole  ${articleArr} ${brandArr} ${new Date()} - ${error.message}`)
    }
     
}

async function createItemDirect(articleArr, brandArr, suplierId, finalDate, priceArr, amountArr, error_path) {
    
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
            
            return await newItemDirect.save()
            
    }catch(error){
        writeLogs(error_path, `createItemDirectNewBM  ${articleArr} ${brandArr} ${new Date()} - ${error.message}`)
    }
}

module.exports = { getDate, writeLogs, getUuid, createOnlyLinkInBM, getFirstImageForItemFromBM, getCategoryByUuid, devideOnChunks, updateAllEndedProducts,  createItemWhole, createItemDirect, getTokenUTR, requestToPreparePriceUTR}