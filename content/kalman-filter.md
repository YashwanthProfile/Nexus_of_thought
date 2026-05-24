---
title: "The Kalman Filter: Optimal Estimation in Noisy Systems"
date: "2024-05-01"
summary: "An intuitive and mathematical look at the Kalman filter, the recursive algorithm that powers everything from GPS to Apollo moon landings."
tags: ["Math", "Control Theory", "Signal Processing"]
authorId: "jd_doe"
contributors: ["h_poincare"]
---

# The Kalman Filter

The Kalman filter is an optimal estimation algorithm. It is used to estimate the state of a system when the state cannot be measured directly, or when measurements are noisy.

## The Mental Model: Predict & Update

The Kalman filter operates in two distinct phases:

1.  **Predict:** The filter uses the dynamic model of the system to predict what the state *should* be at the next time step, along with the uncertainty.
2.  **Update:** When a measurement arrives, the filter compares it with the predicted state and reconciles the two based on their relative certainties (covariances).

## The Mathematical Framework

Let $x_k$ be the state at time $k$. The system is modeled as:

$$
x_k = A x_{k-1} + B u_k + w_k
$$
$$
z_k = H x_k + v_k
$$

Where $w_k$ and $v_k$ are process and measurement noise, assumed to be zero-mean Gaussian.

### 1. Prediction Step

Predicted State Estimate:
$$ \hat{x}_{k|k-1} = A \hat{x}_{k-1|k-1} + B u_k $$

Predicted Error Covariance:
$$ P_{k|k-1} = A P_{k-1|k-1} A^T + Q $$

### 2. Update Step

Innovation (Measurement Residue):
$$ \tilde{y}_k = z_k - H \hat{x}_{k|k-1} $$

Kalman Gain (The Magic):
$$ K_k = P_{k|k-1} H^T (H P_{k|k-1} H^T + R)^{-1} $$

Updated State Estimate:
$$ \hat{x}_{k|k} = \hat{x}_{k|k-1} + K_k \tilde{y}_k $$

Updated Error Covariance:
$$ P_{k|k} = (I - K_k H) P_{k|k-1} $$

## Why It's Optimal

If the noise is Gaussian and the system is linear, the Kalman filter is the **Best Linear Unbiased Estimator (BLUE)**. It minimizes the mean square error of the estimated parameters.

## Extensions

- **Extended Kalman Filter (EKF):** Linearizes about the current mean for non-linear systems using the Jacobian.
- **Unscented Kalman Filter (UKF):** Uses a deterministic sampling technique (sigma points) to handle non-linearity without derivatives.

See how this relates to [Optimal Control](./optimal-control) in our previous notes!
