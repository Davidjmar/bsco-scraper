
import puppeteer from "puppeteer";
import yargs from "yargs";

const getQuotes = async (name, type) => {
  console.log(name);
  console.log(type);

  if(!name || ! type){
    throw Error('EYY where tf is the arguments ');
  }

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    });
  
    const page = await browser.newPage();
  
    await page.goto("https://www.norseprojects.com/", {
      waitUntil: "networkidle0",
    });
    await page.click('button[class="coi-banner__decline"]');

    await page.waitForSelector('.icon-btn.search-btn');
    await page.click('.icon-btn.search-btn');

    await page.waitForSelector('.inner.bar-inner');
    await page.type('input[name="search"]', 'Aros short');
    await page.keyboard.press('Enter');

    await page.waitForSelector('.row > .item > a');
    await page.evaluate(() => {
        const anchor = document.querySelector('.row > .item > a');
        if (anchor) {
            anchor.click();
        }
    });
  
    let variants = [];

    console.log('starting');

    await page.waitForSelector('div[class~="SelectInput"]');
    await page.click('div[class~="SelectInput"]');

    if (variants.length < 1) {
      await page.waitForSelector('div[class~="SelectInput"] > .options');
      variants = await page.evaluate(() => {
        const optionsArray = [];
        const cartOptions = document.querySelector(".cart-options-content");
        const optionItems = cartOptions.querySelector("[class~='SelectInput']").querySelector(".options").querySelectorAll("[class~='option']");
        Array.from(optionItems).map((option) => {
            optionsArray.push(option.innerText);
        });
        return optionsArray;
      });
    }

    const products = await Promise.all(variants.map((variant, index) => {
        if(index > 0){
            page.waitForSelector('div[class~="SelectInput"] > .options');
            page.click(`div[class~="SelectInput"] > .options > .option:nth-child(${index})`);
        }
         const variantData = page.evaluate((variant, type) => {
            const product = {
                Title: null,
                Description: null,
                ProductType: type,
                Price: null,
                imageUrls:[],
                Vendor: "Norse Projects",
                status: "draft",
                Published: false,
            };    
    
            // Fetch the first element with class "quote"
            // Get the displayed text and returns it
            const detailsContent = document.querySelectorAll(".details-content");
            // Convert the quoteList to an iterable array
            // For each quote fetch the text and author
            Array.from(detailsContent).map((quote) => {
            // Fetch the sub-elements from the previously fetched quote element
            // Get the displayed text and return it (`.innerText`)
            const title = quote.querySelector("h1").innerText;
            const description = quote.querySelector(".description").innerText;
            product.Title = `${title} - ${variant}`;
            product.Description = description;
            });

            const cartOptions = document.querySelectorAll(".cart-options-content");
            Array.from(cartOptions).map((quote) => {
                // Fetch the sub-elements from the previously fetched quote element
                // Get the displayed text and return it (`.innerText`)
                let price = quote.querySelector(".price").querySelector(".price-html").querySelector(".price").innerText;
                price = price.replace("USD", "")
                price = parseFloat(price);
                product.Price = price;
            });
    
            // images-loaded-container
            const imageTags = document.querySelectorAll(".images-loaded-container");
            Array.from(imageTags).map((image) => {
                let url = image.querySelector("[class~='gallery-image']").style.getPropertyValue("background-image");
                url = url.replace('url("', "");
                url = url.replace('")', "");
                product.imageUrls.push(url);
            });
    
            return product;
          }, variant, type);

        if(index > 0 && index < variants.length){
            page.goBack();
            page.waitForNavigation({ waitUntil: 'networkidle0' });
        }
        return variantData;
    }));

    console.log( products);
    console.log('end');

    await browser.close();
  };
  
  const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 --name [name] --type [type]')
  .demandOption(['name', 'type'])
  .argv;

  const name = argv.name;
  const type = argv.type;

  getQuotes(name, type);