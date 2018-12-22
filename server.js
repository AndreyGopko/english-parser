const express = require('express');
const fs = require('fs');
const cors = require('cors');
const puppeteer = require('puppeteer');
const app = express();

app.use(cors())

app.use((request, response, next) => {
    next()
})

app.use((request, response, next) => {
    request.chance = Math.random()
    next()
})

function saveResultsToFile(filename, data) {
  fs.writeFile('./'+filename+'.json', JSON.stringify(data), () => {});
}

const parse = async (urlPage) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setExtraHTTPHeaders({
    Authorization: 'Basic ZW5nbGlzaHByb2ZpbGU6dm9jYWJ1bGFyeQ=='
  })
  await page.goto(urlPage);
  await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.2.1.min.js'})

  const letterPageUrls = [];

  const letterPages = async () => {
    const letterPage = await page.evaluate(async () => {
      try {
        const nextPageButton = $('.content-panel #result > a[title="Next"]').get(0);
        const nextPageUrl = nextPageButton && nextPageButton.href;

        const words = $('.content-panel #result > ul > li > a').map(function(i, el) {
          return 'http://vocabulary.englishprofile.org' + $(el).attr('href')
        }).get().filter(page => /.#$/gim.test(page));

        return {
          nextPageUrl,
          words
        };
      } catch(e) {
        console.error(e);
      }
    })

    letterPageUrls.push(letterPage.words);
    if (letterPage.nextPageUrl) {
      await page.goto(letterPage.nextPageUrl);
      await letterPages();
    }
  }

  await letterPages();

  const pages = [].concat.apply([], letterPageUrls);

  const results = [];

  for (let url of pages) {
    await page.goto(url);
    const result = await page.evaluate(() => {
      try {
        const word = $('.content-panel #dictionary_entry .head .hw a').text();
        const transcription = `/${$('.content-panel #dictionary_entry .head .pron .ipa').text()}/`;
        const wordFamily = $('.content-panel #dictionary_entry .WordBuilder .section')
          .map(function(i, el){
          return {
            part: $(el).find('.heading').text().trim(),
            value: $(el).find('.word, .cword a')
              .map(function(i, el) {
                return el.innerText
              }).get().join(', '),
          }
        }).get();
        const gropus = $('.content-panel #dictionary_entry .posblock')
          .map(function(i, el) {
            return {
              part: {
                title: $(el).find('> .posgram .pos').text(),
                blocks: $(el).find('> .gwblock, > .phrasal_verb').map(function(j, node) {
                  if ($(node).is('.phrasal_verb')) {
                    return {
                      phrasalVerb: $(node).find('.pv_head h3.phrase').text(),
                      phrasalBlocks: $(node).find('> .gwblock').map(function(j, node) {
                        return {
                          short: $(node).find('h3.gw').text(),
                          phrase: $(node).find('h3.phrase').text(),
                          sense: {
                            level: $(node).find('.sense [class^="freq-"]').text(),
                            grams: $(node).find('.sense > .grams').text().trim(),
                            def: $(node).find('.sense > .def').text().trim(),
                            dictionaryExamples: $(node).find('.sense > .examp-block').find('> .examp')
                              .map(function(jj, node2) {
                                return $(node2).text()
                              }).get(),
                            learnerExample: $(node).find('.sense > .clc').text(),
                          }
                        }
                      }).get()
                    }
                  }
                  return {
                    short: $(node).find('h3.gw').text(),
                    phrase: $(node).find('h3.phrase').text(),
                    sense: {
                      level: $(node).find('.sense [class^="freq-"]').text(),
                      grams: $(node).find('.sense > .grams').text().trim(),
                      def: $(node).find('.sense > .def').text().trim(),
                      dictionaryExamples: $(node).find('.sense > .examp-block').find('> .examp')
                        .map(function(jj, node2) {
                          return $(node2).text()
                        }).get(),
                      learnerExample: $(node).find('.sense > .clc').text(),
                    }
                  }
                  }).get()
              }
            }
          }).get()
        
        return {
          link: window.location.href,
          data: {
            word,
            transcription,
            wordFamily,
            gropus
          }
        }
      } catch (err) {
        return err;
      }
    });
    results.push(result);
  }

  await browser.close();
  return results;
}

app.get('/', (request, response) => {
  const { queryUrl, letter } = request.query;
  parse(queryUrl).then(res => {
    saveResultsToFile(letter, res)
    response.send(res);
  }).catch(e => console.log('ERROR', e));
})

app.listen(3001)