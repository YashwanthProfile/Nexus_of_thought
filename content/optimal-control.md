---
title: "The Geometry of Optimal Control"
date: "2024-04-22"
summary: "An exploration of Pontryagin's Minimum Principle and its geometric interpretation in phase space."
tags: ["Math", "Control Theory", "Physics"]
authorId: "jd_doe"
contributors: ["l_euler"]
---

# The Geometry of Optimal Control

Optimal control theory is a branch of mathematical optimization that deals with finding a control for a dynamical system over a period of time such that an objective function is optimized.

## The Problem Statement

Consider a system described by:

$$
\begin{equation}
  x = \begin{bmatrix} x1 \\ x2 \\ x3 \end{bmatrix}
\end{equation}
$$

$$
\dot{x}(t) = f(x(t), u(t), t)
$$

where $x(t)$ is the state and $u(t)$ is the control. We want to minimize:

$$
J = \Phi(x(T), T) + \int_{0}^{T} L(x(t), u(t), t) dt
$$

## Pontryagin's Minimum Principle

The Hamiltonian $H$ is defined as:

$$
H(x, p, u, t) = p^T f(x, u, t) + L(x, u, t)
$$

The necessary conditions for optimality are:

1.  **State Equation:** $\dot{x} = \frac{\partial H}{\partial p} = f(x, u, t)$
2.  **Costate Equation:** $\dot{p} = -\frac{\partial H}{\partial x} = -\left[\frac{\partial f}{\partial x}\right]^T p - \frac{\partial L}{\partial x}$
3.  **Stationarity:** $H(x^*, p^*, u^*, t) \le H(x^*, p^*, u, t)$ for all $u \in U$

## Example: Brachistochrone Curve

The brachistochrone problem is one of the earliest examples of the calculus of variations. The objective is to find the curve between two points that is traversed in the least time by a body moving under gravity.

$$
T = \int_{x_1}^{x_2} \sqrt{\frac{1 + (y')^2}{2gy}} dx
$$

The solution is a **cycloid**.

### Table of Comparisons

| Method | Convergence | Complexity |
| :--- | :--- | :--- |
| Gradient Descent | Linear | Low |
| Newton's Method | Quadratic | High |
| L-BFGS | Superlinear | Medium |

### Footnotes

This principle was formulated in 1956 by the Soviet mathematician Lev Pontryagin and his students.[^1]

[^1]: Pontryagin, L. S.; Boltyanskii, V. G.; Gamkrelidze, R. V.; Mishchenko, E. F. (1962). The Mathematical Theory of Optimal Processes.
