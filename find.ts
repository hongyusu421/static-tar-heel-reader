/*
 * get the string from the search box
 * split it into words
 * stem them and toss any we should ignore
 * for each word
 *   fetch the index and split it into ids
 * intersect the arrays of ids
 * for each id in the intersection
 *   get the index entry
 *   add it to the page
 *   quit and remember where we are if we have enough
 */

import {stem} from 'stemr';

function getQueryTerms(): string[] {
  const searchBox = document.getElementById('search') as HTMLInputElement;
  console.log(searchBox);
  const query = searchBox.value;
  console.log('q', query);
  const pattern = /[a-z]{3,}/gi;
  const terms = query.match(pattern).map(stem);
  return terms;
}

async function getIndexForTerm(term: string): Promise<string[]> {
  const resp = await fetch('index/' + term);
  let result;
  if (resp.ok) {
    const text = await resp.text();
    console.log('text', text.length);
    const N = text.length / 3;
    result = new Array(N);
    for (let i = 0; i < N; i++) {
      result[i] = text.slice(i * 3, i * 3 + 3);
    }
  } else {
    result = [];
  }
  return result;
}

function intersect(x: string[], y: string[]): string[] {
  let i = 0,
    j = 0,
    r = [];
  while (i < x.length && j < y.length) {
    if (x[i] < y[j]) {
      i++;
    } else if (y[j] < x[i]) {
      j++;
    } else {
      r.push(x[i]);
      i++;
      j++;
    }
  }
  return r;
}

function intersectIndexes(indexes: string[][]) {
  // get the shortest one first
  indexes.sort((a, b) => a.length - b.length);
  return indexes.reduce(intersect);
}

function bidToIndex(bid: string): string {
  return `${bid[0]}/${bid[1]}/index.html`;
}

async function getBookCover(bid: string): Promise<HTMLElement | null> {
  // get the prefix of the path for this index
  const prefix = bid
    .split('')
    .join('/')
    .slice(0, 4);
  // fetch the index
  const resp = await fetch(prefix + 'index.html');
  // get the html
  const html = await resp.text();
  // parse it
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  // get the entry for this book
  const item = doc.getElementById(bid);
  if (item) {
    // fix the image URL
    const imgs = item.getElementsByTagName('img');
    const img: HTMLImageElement = imgs[0];
    img.setAttribute('src', prefix + img.getAttribute('src'));
    // fix the link URL
    const links = item.getElementsByTagName('a');
    const link: HTMLAnchorElement = links[0];
    link.setAttribute('href', prefix + link.getAttribute('href'));
  }
  return item;
}

function addBookToPage(book: HTMLElement) {
  const list = document.getElementsByTagName('ul');
  if (list) {
    list[0].appendChild(book);
  }
}

async function find() {
  const terms = getQueryTerms();
  const indexes = [];
  for (const term of terms) {
    const index = await getIndexForTerm(term);
    if (index.length) {
      indexes.push(index);
    }
  }
  let i = 0;
  const list = document.getElementsByTagName('ul');
  if (list) {
    const node = list[0];
    let last;
    while ((last = node.lastChild)) node.removeChild(last);
  }
  for (const bid of intersectIndexes(indexes)) {
    const book = await getBookCover(bid);
    if (book) {
      i += 1;
      addBookToPage(book);
    }
    if (i >= 20) {
      // figure out how to continue
      break;
    }
  }
}

function init() {
  const form = document.getElementsByTagName('form');
  if (form.length) {
    form[0].addEventListener('submit', e => {
      e.preventDefault();
      find();
    });
  }
  find();
}

window.addEventListener('load', init);
