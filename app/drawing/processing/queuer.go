package processing

type ProcessingOptions struct {
	DrawingId  int
	MaxVectors int
}

var creationQueue chan ProcessingOptions
var workQueue chan ProcessingOptions

func PrepareQueues() {
	processorCount := 5
	creationQueue = make(chan ProcessingOptions)
	workQueue = make(chan ProcessingOptions, processorCount)

	go processCreationQueue()

	for i := 0; i < processorCount; i++ {
		go processWorkQueue()
	}
}

func AddToQueue(id int) {
	// Maintain backward compatibility with default value
	AddToQueueWithOptions(id, 100)
}

func AddToQueueWithOptions(id int, maxVectors int) {
	creationQueue <- ProcessingOptions{
		DrawingId:  id,
		MaxVectors: maxVectors,
	}
}

func processCreationQueue() {
	for {
		select {
		case options := <-creationQueue:
			workQueue <- options
		}
	}
}

func processWorkQueue() {
	for {
		select {
		case options := <-workQueue:
			Process(options.DrawingId, options.MaxVectors)
		}
	}
}
