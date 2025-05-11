package processing

import (
	"api/app/drawing/processing/draw_vector"
	"api/app/drawing/store"
	"api/app/drawing/types"
)

// Add an overloaded Process function that accepts the maxVectors parameter
func Process(drawingId int, maxVectors int) {
	var originalPointsFactory OriginalPointsFactory = OriginalPointsFactory{}

	originalPoints := originalPointsFactory.Build(drawingId)
	vectors := draw_vector.BuildSeries(originalPoints, maxVectors)

	saveDrawVectors(drawingId, vectors)
}

func saveDrawVectors(drawingId int, vectors []types.DrawVector) {
	store := store.New()
	store.AddVectors(drawingId, vectors)
}
