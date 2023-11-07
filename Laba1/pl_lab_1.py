import requests
from bs4 import BeautifulSoup
from queue import Queue
from threading import Thread
import time

class NewsScraper:
    def __init__(self, urls):
        self.urls = urls
        self.news_counts = {url: 0 for url in urls}
        self.visited_urls = set()
        self.news_queue = Queue()
               
    def scrape_politico(self, url):
        response = requests.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            self.news_counts[url] = 0
            titles = soup.find_all('h3', class_='headline')
            for title in titles:
                summary = title.find_next('p', class_='dek')
                author = title.find_next('a', class_='url')

                if summary and author:
                    title_text = title.text
                    summary_text = summary.text
                    author_text = author.text

                    if all(x not in self.visited_urls for x in [title_text, summary_text, author_text]):
                        self.visited_urls.update([title_text, summary_text, author_text])
                        self.news_queue.put(('Заголовок', title_text))
                        self.news_queue.put(('Аннотация', summary_text))
                        self.news_queue.put(('Автор', author_text))

    def scrape_riatom(self, url):
        response = requests.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            self.news_counts[url] = 0
            titles = soup.find_all('div', class_='mainTitle')
            for title in titles:
                summary = title.find_next('div', class_='mainAnons')
                author = title.find_next('div', class_='mainTime')

                if summary and author:
                    title_text = title.text
                    summary_text = summary.text
                    author_text = author.text

                    if all(x not in self.visited_urls for x in [title_text, summary_text, author_text]):
                        self.visited_urls.update([title_text, summary_text, author_text])
                        self.news_queue.put(('Заголовок', title_text))
                        self.news_queue.put(('Аннотация', summary_text))
                        self.news_queue.put(('Время', author_text))

    def scrape_ixbt(self, url):
        response = requests.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            self.news_counts[url] = 0
            titles = soup.find_all('a', class_='card-link')
            for title in titles:
                summary = title.find_next('div', class_='d-flex d-sm-block my-2')
                author = title.find_next('a', class_='text-secondary d-flex align-items-center')

                if summary and author:
                    title_text = title.text
                    summary_text = summary.text
                    author_text = author.text

                    if all(x not in self.visited_urls for x in [title_text, summary_text, author_text]):
                        self.visited_urls.update([title_text, summary_text, author_text])
                        self.news_queue.put(('Заголовок', title_text))
                        self.news_queue.put(('Аннотация', summary_text))
                        self.news_queue.put(('Автор', author_text))

    def loop_scraping(self, interval):
        try:
            while True:
                self.start_scraping()
                time.sleep(interval)
        except KeyboardInterrupt:
            print("Scraping stopped by user.")

    def start_scraping(self):
        threads = []
        
        for url in self.urls:
            if 'www.politico.com' in url:
                thread = Thread(target=self.scrape_politico, args=(url,))
            elif 'www.riatomsk.ru' in url:
                thread = Thread(target=self.scrape_riatom, args=(url,))
            elif 'ixbt.games' in url:
                thread = Thread(target=self.scrape_ixbt, args=(url,))
            else:
                continue

            thread.start()
            threads.append(thread)
        
        for t in threads:
            t.join()

        while not self.news_queue.empty():
            category, news = self.news_queue.get()
            print(f'{category}: {news}')

urls = ['https://www.riatomsk.ru/', 'https://www.politico.com/','https://ixbt.games/news/']
news_scraper = NewsScraper(urls)
news_scraper.loop_scraping(12)