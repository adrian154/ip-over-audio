# ip-over-audio

Experiments with transferring data over audio

# QAM

Our signal is equal to

$$s(t) = I(t)\sin(2\pi f_c t) + Q(t)\cos(2\pi f_c t)$$

Multiplying it by a sine signal yields

$$I(t)\sin(2\pi f_c t)\sin(2\pi f_c t) + Q(t)\cos(2\pi f_c t)\sin(2\pi f_c t)$$

We can simplify this using the trigonometric identities:

$$\begin{align*}
I(t)\sin(2\pi f_c t)\sin(2\pi f_c t) + Q(t)\cos(2\pi f_c t)\sin(2\pi f_c t) &= \\
\frac12I(t)[1 - \cos(4\pi f_c t)] + \frac12Q(t)\sin(4\pi f_c t) &= \\
\frac12I(t) - \frac12\cos(4\pi f_c t) + \frac12 Q(t) \sin(4\pi f_c t)
\end{align*}$$

$$\begin{align*}
I(t)\sin(2\pi f_c t)\cos(2\pi f_c t) + Q(t)\cos(2\pi f_c t)\cos(2\pi f_c t) &= \\
\frac12I(t)\sin(4\pi f_c t) + \frac12 Q(t)[1 + \cos(4\pi f_c t)] &= \\
\frac12Q(t) + \frac12\cos(4\pi f_c t) + \frac12I(t)\sin(4\pi f_c t)
\end{align*}$$