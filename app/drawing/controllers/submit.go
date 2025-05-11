package controllers

import (
	"github.com/labstack/echo/v4"
	"net/http"

	"api/app/drawing/processing"
	"api/app/drawing/store"
	"api/app/drawing/types"
)

func Submit(c echo.Context) error {
	points, _ := c.Get("points").([]types.OriginalPoint)
	maxVectors, _ := c.Get("maxVectors").(int)

	id := store.New().Create(points)

	// Pass max vectors parameter to the processing system
	processing.AddToQueueWithOptions(id, maxVectors)

	return c.JSON(http.StatusOK, Response{id})
}

type Response struct {
	Id int `json:"id"`
}
