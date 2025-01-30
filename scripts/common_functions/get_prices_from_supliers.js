const axios = require("axios");

async function getCsvPriceFromBM () {
    
    return new Promise((resolve, reject)=> {
        
        let body =  JSON.stringify({
              "currency": "A358000C2947F7AE11E23F5617780B16",
              "warehouses": ["ACF9000C2947F7AE11E28A2B02C4AD32"]
            });
            
        const options = {
            method: "POST",
            url: `https://api.bm.parts/prices/list`,
             data : body,
            headers: { 
            Authorization: "4b17c6ab-d276-43cb-a6bf-bd041bf7bec8.1oR0k6llb6Wpim03FgaovxLlNhE"},
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
            };

        axios
            .request(options)
            .then((response) => {
               
                resolve(response.data)}
              ).catch((error) => {
              resolve("Помилка");
            });
            })
}

async function getJsonTechnoMirPrice () {
    return new Promise((resolve, reject)=> {
        const options = {
        method: "POST",
        url: "https://api.tehnomir.com.ua/price/getStockPrice",
        data: {
          apiToken: "jLiA0DZd9LwG6K75xXpfMoZX8t3L7SsO"
        },
        headers: { "Content-Type": "application/json" },
      };
  
  axios.request(options).then((response) => {
    resolve(response.data)
  })
    })
}

async function getJsonUTR (token) {
    const lists = await getListOfPrices(token)
    const price = await getPriceUnickTrade(token, lists[0].token)
    return price
}

async function getListOfPrices (token) {

    return new Promise(async (resolve, reject)=> {
    
  const options = {
    method: "GET",
    url: "https://order24-api.utr.ua/pricelists",
    headers: { "Content-Type": "application/json",
    Authorization: "Bearer " + token
        },
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

async function getPriceUnickTrade (token, tokenPrice) {

    return new Promise(async (resolve, reject)=> {
    
  const options = {
    method: "GET",
    url: `https://order24-api.utr.ua/pricelists/export/${tokenPrice}`,
    headers: { "Content-Type": "application/json",
    Authorization: "Bearer " + token
        },
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

module.exports = { getCsvPriceFromBM, getJsonTechnoMirPrice, getJsonUTR }