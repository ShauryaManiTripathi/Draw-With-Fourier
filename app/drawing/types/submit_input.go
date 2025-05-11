package types

type SubmitInput struct {
	Points     []OriginalPoint `json:"points"`
	MaxVectors int             `json:"maxVectors,omitempty"`
}
