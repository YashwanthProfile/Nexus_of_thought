---
title: "Understanding Attention Mechanisms"
date: "2024-05-18"
summary: "A deep dive into the transformer architecture and how attention mechanisms work from first principles."
tags: ["Deep Learning", "Transformers", "NLP"]
authorId: "am_turing, c_shannon"
contributors: ["l_euler"]
---

# Understanding Attention Mechanisms

Attention is all you need? Maybe. Let's look at the math.

The core of the attention mechanism is the scaled dot-product attention:

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$

Where:
- $Q$ is the Query matrix
- $K$ is the Key matrix
- $V$ is the Value matrix
- $d_k$ is the dimension of the keys

## Multi-Head Attention

Instead of performing a single attention function with $d_{model}$-dimensional keys, values and queries, we found it beneficial to linearly project the queries, keys and values $h$ times with different, learned linear projections to $d_k, d_k$ and $d_v$ dimensions, respectively.

```python
import torch
import torch.nn as nn

class ScaledDotProductAttention(nn.Module):
    def __init__(self, d_k):
        super().__init__()
        self.d_k = d_k

    def forward(self, q, k, v, mask=None):
        scores = torch.matmul(q, k.transpose(-2, -1)) /  math.sqrt(self.d_k)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        attn = torch.softmax(scores, dim=-1)
        output = torch.matmul(attn, v)
        return output, attn
```

## Visualizing the Weights

![Attention Map](https://images.unsplash.com/photo-1620712943543-bcc4628c9457?auto=format&fit=crop&q=80&w=1000)
*Figure 1: Visualization of attention weights in a transformer layer.*

Stay tuned for the next part where we discuss Positional Encoding!

Check out our deep dive into [SVD](./singular-value-decomposition) for how matrices can be decomposed.
