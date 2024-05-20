
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
  
    await page.goto("https://www.rogueterritory.com/", {
      waitUntil: "networkidle0",
    });

    await page.waitForSelector('.site-search-handle');
    await page.click('.site-search-handle');

    await page.waitForSelector('input[name="q"]');
    await page.type('input[name="q"]', name);
    await page.keyboard.press('Enter');

    await page.waitForSelector('.results > .search-item');
    let variants = [];

    if (variants.length < 1) {

      variants = await page.evaluate(() => {
        const foobar = []
        const optionItems = document.querySelector(".search-results").querySelectorAll(".search-item");
        Array.from(optionItems).map((option) => {
            const title = option.querySelector(".content > .title").innerText;
            foobar.push(title);
        });
        return foobar;
      });
    }

    await page.waitForSelector('.results > .search-item');
    await page.evaluate(() => {
        const anchor = document.querySelector('.results > .search-item');
        if (anchor) {
            anchor.click();
        }
    });

    await page.waitForSelector('select[class="product-variants"]');
  
    console.log('starting');

    const products = await Promise.all(variants.map((title, index) => {
        if(index > 0){
            page.waitForSelector('.site-search-handle');
            page.click('.site-search-handle');
            page.waitForSelector('input[name="q"]');
            page.type('input[name="q"]', title);
            page.keyboard.press('Enter');
            page.waitForSelector('select[class="product-variants"]');
        }
         const variantData = page.evaluate((title, type) => {
            const product = {
                Title: title,
                Description: null,
                ProductType: type,
                Price: null,
                imageUrls:[],
                Vendor: "Rogue Territory",
                status: "draft",
                Published: false,
                sizes: [],
            };
            
            const sizeOptions = document.querySelectorAll("#product-size option");
            Array.from(sizeOptions).map((option) => {
              product.sizes.push(option.innerHTML);
            });

            const descriptionEntries = document.querySelectorAll('p[data-mce-fragment="1"]');
            Array.from(descriptionEntries).map((quote) => {
                product.Description = `${product.Description} \n ${quote.innerText}`;
            });

            let price = document.querySelector('span[id="productPrice"]').innerText;
            price = price.replace("$", "")
            price = parseFloat(price);
            product.Price = price;
            product.Price = price;

            const imageTags = document.querySelectorAll("div[class~='gallery-item']");
            Array.from(imageTags).map((image) => {
                let url = image.style.getPropertyValue("background-image");
                url = url.replace('url("', "https:");
                url = url.replace('")', "");
                product.imageUrls.push(url);
            });
    
            return product;
          }, title, type);

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