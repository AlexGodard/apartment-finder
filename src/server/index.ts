import { config } from 'dotenv';
import * as kijiji from 'kijiji-scraper';
import Koa from 'koa';

if (process.env.NODE_ENV === 'development') {
  config({ path: `${process.env.HOME}/.env` });
}

import { logger } from './logging';
import { getTestMessageUrl, sendMailAsync } from './mailer';
import { saddAsync, smembersAsync } from './redis';
import { routes } from './routes';

const app = new Koa();

app.use(logger);
app.use(routes);

app.listen(3000);

console.log(`Server running on port ${3000}`);

const options = {
  minResults: 20,
  scrapeResultDetails: false,
};

const params = {
  categoryId: 37,
  locationId: 1700281,
  maxPrice: 900,
  minPrice: 400,
  sortByName: 'dateDesc',  // Show the cheapest listings first,
};

let counter = 0;

const searches = ['saint+henri', 'st+henri', 'atwater'];

// Scrape using returned promise
setInterval(async () => {
  try {
    let ads = await kijiji.search({ ...params, keywords: searches[counter % searches.length]  }, options);
    ads = ads.map((ad: any) => ({ ...ad, id: ad.url.substr(ad.url.lastIndexOf('/') + 1) }));
    const oldAds = await smembersAsync('seen_ads');

    const newAds = ads.filter((ad: any) => !oldAds.includes(ad.id));
    if (newAds.length) {
      const info = await sendMailAsync({
        from: process.env.SEND_MAIL_FROM, // sender address
        html: `<div>I found an apartment for ya.:${newAds.reduce((carry: string, newAd: any) => {
          return carry + `<br /><br/><a href="${newAd.url}">${newAd.url}</a>`;
        }, '')}</div>`, // html body
        subject: 'New kijiji ads found', // Subject line
        text: `I found an apartment for ya. ${newAds.reduce((carry: string, newAd: any) => {
          return carry + `${newAd.url}, `;
        }, '')}`, // plain text body,
        to: process.env.SEND_MAIL_TO, // list of receivers
      });

      await saddAsync('seen_ads', ...newAds.map((newAd: any) => newAd.id));

      if (process.env.NODE_ENV !== 'production') {
        console.log(`Preview URL: ${getTestMessageUrl(info)}`);
      }
    }

  } catch (e) {
    console.log(e);
  }

  counter += 1;
}, 30000);

export { app };
