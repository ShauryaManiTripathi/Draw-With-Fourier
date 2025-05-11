package main

import (
	"api/app"
	"api/database"
)

func main() {
	e := app.New()

	dbError := database.Initialize()

	if dbError == nil {
		e.Logger.Fatal(e.Start(":8081"))
	} else {
		e.Logger.Fatal(dbError)
	}
}
