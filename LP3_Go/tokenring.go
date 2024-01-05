package main

import (
	"fmt"
	"sync"
	"time"
)

type Token struct {
	Data           string
	Recipient, TTL int
}

func main() {
	var n int

	fmt.Print("Введите число узлов в токен-ринге: ")
	fmt.Scanln(&n)

	// Инициализируем каналы для узлов.
	channels := make([]chan Token, n)

	for i := range channels {
		channels[i] = make(chan Token)
	}

	var wg sync.WaitGroup

	// Создаем узлы со связями.
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			next := (i + 1) % n

			for {
				token, ok := <-channels[i]
				if !ok {
					// Закрытие канала
					return
				}

				if token.TTL <= 0 {
					if token.Recipient != i {
						fmt.Printf("Сообщение для узла %d не доставлено: TTL истек\n", token.Recipient)
					}
					continue
				}

				token.TTL--

				if token.Recipient == i {
					fmt.Printf("Узел %d получил сообщение: '%s'\n", i, token.Data)
					continue
				}

				channels[next] <- token
			}
		}(i)
	}

	var (
		data           string
		recipient, ttl int
	)

	fmt.Print("Введите сообщение: ")
	fmt.Scanln(&data)

	fmt.Print("Введите номер узла-получателя: ")
	fmt.Scanln(&recipient)

	fmt.Print("Введите время жизни токена (TTL): ")
	fmt.Scanln(&ttl)

	startNode := 0
	channels[startNode] <- Token{Data: data, Recipient: recipient, TTL: ttl}

	time.Sleep(2 * time.Second)
	for i := range channels {
		close(channels[i])
	}
	wg.Wait()
}
