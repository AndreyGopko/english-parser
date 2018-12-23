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
  fs.writeFile('../'+filename+'.json', JSON.stringify(data), () => {});
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
        const notes = $('.content-panel #dictionary_entry .head .infgrp').text();
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
        const groups = $('.content-panel #dictionary_entry .posblock')
          .map(function(i, el) {
            return {
              part: {
                title: $(el).find('> .posgram .pos').text(),
                transcription: `/${$(el).find('> .pron .ipa').text()}/`,
                grams: $(el).find('> .posgram .grams').text().trim(),
                form: $(el).find('> .infgrp').text(),
                blocks: $(el).find('> .gwblock, > .phrasal_verb').map(function(j, node) {
                  if ($(node).is('.phrasal_verb')) {
                    return {
                      phrasalVerb: $(node).find('.pv_head h3.phrase').text(),
                      phrasalBlocks: $(node).find('> .gwblock').map(function(j, node) {
                        return {
                          short: $(node).find('h3.gw').text(),
                          phrase: $(node).find('h3.phrase').text(),
                          style: $(node).find('span.lab').text(),
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
                    style: $(node).find('span.lab').text(),
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
            notes,
            wordFamily,
            groups
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

app.get('/', async (request, response) => {
  request.setTimeout(7000000);
  // const { queryUrls, letter } = request.query;
  const queryUrls = [
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/A/US1001497',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/B/US1005691',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/C/US1185916',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/D/US1016799',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/E/US1021237',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/F/3265887',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/G/US3352247',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/H/US1032335',
    'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/I/US1087281',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/J/US1038422',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/K/US2001716',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/L/US1039771',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/M/3355078',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/N/US1046648',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/O/US1048340',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/P/US1050324',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/Q/US3394355',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/R/US1057115',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/S/1060918',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/T/US1070752',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/U/2001218',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/V/US3408153',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/W/US1077528',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/X/US3408466',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/Y/US1080075',
    // 'http://vocabulary.englishprofile.org/dictionary/word-list/us/a1_c2/Z/US2001710',
  ];

  for (let queryUrl of queryUrls) {
    const urlSplitted = queryUrl && queryUrl.split('/');
    const letter = urlSplitted[urlSplitted.length - 2];
    console.log(queryUrl, letter);
    await parse(queryUrl).then(async res => {
      await saveResultsToFile(letter, res)
      await response.send(res);
    }).catch(e => console.log('ERROR', e));
  }
})

app.listen(3001)