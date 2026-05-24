import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import os

# ----------------------------
# Parameters
# ----------------------------
frames = 240
dt = 0.06

I_body = np.diag([6.0, 4.0, 3.0])
I_wheel = np.diag([0.7, 0.7, 0.7])

# Initial spacecraft tumbling
omega_body = np.array([0.9, 0.55, 0.35])

# Wheel speeds start at zero
omega_wheel = np.array([0.0, 0.0, 0.0])

# Controller strength
K = 0.12

q = np.array([1.0, 0.0, 0.0, 0.0])

# ----------------------------
# Quaternion utilities
# ----------------------------
def quat_multiply(a, b):
    aw, ax, ay, az = a
    bw, bx, by, bz = b
    return np.array([
        aw*bw - ax*bx - ay*by - az*bz,
        aw*bx + ax*bw + ay*bz - az*by,
        aw*by - ax*bz + ay*bw + az*bx,
        aw*bz + ax*by - ay*bx + az*bw
    ])

def update_quaternion(q, omega, dt):
    omega_q = np.array([0.0, omega[0], omega[1], omega[2]])
    qdot = 0.5 * quat_multiply(q, omega_q)
    q = q + qdot * dt
    return q / np.linalg.norm(q)

def quat_to_R(q):
    q = q / np.linalg.norm(q)
    w, x, y, z = q
    return np.array([
        [1 - 2*(y*y + z*z), 2*(x*y - z*w),     2*(x*z + y*w)],
        [2*(x*y + z*w),     1 - 2*(x*x + z*z), 2*(y*z - x*w)],
        [2*(x*z - y*w),     2*(y*z + x*w),     1 - 2*(x*x + y*y)]
    ])

def rotate(points, R):
    return points @ R.T

# ----------------------------
# Spacecraft wireframe cube
# ----------------------------
cube = np.array([
    [-1,-1,-1], [1,-1,-1], [1,1,-1], [-1,1,-1],
    [-1,-1, 1], [1,-1, 1], [1,1, 1], [-1,1, 1]
]) * 0.65

edges = [
    (0,1),(1,2),(2,3),(3,0),
    (4,5),(5,6),(6,7),(7,4),
    (0,4),(1,5),(2,6),(3,7)
]

# Reaction wheel setup
wheel_radius = 0.32
theta = np.linspace(0, 2*np.pi, 100)

def wheel_circle(axis):
    if axis == "x":
        return np.column_stack([
            np.zeros_like(theta),
            wheel_radius*np.cos(theta),
            wheel_radius*np.sin(theta)
        ])
    if axis == "y":
        return np.column_stack([
            wheel_radius*np.cos(theta),
            np.zeros_like(theta),
            wheel_radius*np.sin(theta)
        ])
    if axis == "z":
        return np.column_stack([
            wheel_radius*np.cos(theta),
            wheel_radius*np.sin(theta),
            np.zeros_like(theta)
        ])

def wheel_spokes(axis, angle):
    r = wheel_radius

    if axis == "x":
        spoke1 = np.array([[0, -r*np.cos(angle), -r*np.sin(angle)],
                           [0,  r*np.cos(angle),  r*np.sin(angle)]])
        spoke2 = np.array([[0, -r*np.cos(angle + np.pi/2), -r*np.sin(angle + np.pi/2)],
                           [0,  r*np.cos(angle + np.pi/2),  r*np.sin(angle + np.pi/2)]])
    elif axis == "y":
        spoke1 = np.array([[-r*np.cos(angle), 0, -r*np.sin(angle)],
                           [ r*np.cos(angle), 0,  r*np.sin(angle)]])
        spoke2 = np.array([[-r*np.cos(angle + np.pi/2), 0, -r*np.sin(angle + np.pi/2)],
                           [ r*np.cos(angle + np.pi/2), 0,  r*np.sin(angle + np.pi/2)]])
    else:  # z
        spoke1 = np.array([[-r*np.cos(angle), -r*np.sin(angle), 0],
                           [ r*np.cos(angle),  r*np.sin(angle), 0]])
        spoke2 = np.array([[-r*np.cos(angle + np.pi/2), -r*np.sin(angle + np.pi/2), 0],
                           [ r*np.cos(angle + np.pi/2),  r*np.sin(angle + np.pi/2), 0]])

    return spoke1, spoke2

# ----------------------------
# Simulate
# ----------------------------
q_hist = []
omega_body_hist = []
omega_wheel_hist = []
wheel_angle_hist = []

wheel_angles = np.array([0.0, 0.0, 0.0])

for i in range(frames):
    # Reaction wheels apply control torque opposing spacecraft angular velocity
    torque_body = -K * omega_body

    # Body response
    alpha_body = np.linalg.inv(I_body) @ torque_body
    omega_body = omega_body + alpha_body * dt

    # Equal and opposite angular acceleration of wheels
    alpha_wheel = -np.linalg.inv(I_wheel) @ torque_body
    omega_wheel = omega_wheel + alpha_wheel * dt

    # Make wheel spin visually strong
    wheel_angles += omega_wheel * dt * 4.0

    # Update spacecraft orientation
    q = update_quaternion(q, omega_body, dt)

    q_hist.append(q.copy())
    omega_body_hist.append(omega_body.copy())
    omega_wheel_hist.append(omega_wheel.copy())
    wheel_angle_hist.append(wheel_angles.copy())

q_hist = np.array(q_hist)
omega_body_hist = np.array(omega_body_hist)
omega_wheel_hist = np.array(omega_wheel_hist)
wheel_angle_hist = np.array(wheel_angle_hist)

# ----------------------------
# Animation
# ----------------------------
fig = plt.figure(figsize=(8, 7))
ax = fig.add_subplot(111, projection="3d")

def setup_axes():
    ax.set_xlim(-1.8, 1.8)
    ax.set_ylim(-1.8, 1.8)
    ax.set_zlim(-1.8, 1.8)
    ax.set_xlabel("Inertial X")
    ax.set_ylabel("Inertial Y")
    ax.set_zlabel("Inertial Z")
    ax.set_title("3D Reaction Wheel Stabilization")

def animate(i):
    ax.clear()
    setup_axes()

    R = quat_to_R(q_hist[i])

    # Draw spacecraft cube
    cube_rot = rotate(cube, R)
    for a, b in edges:
        ax.plot(
            [cube_rot[a,0], cube_rot[b,0]],
            [cube_rot[a,1], cube_rot[b,1]],
            [cube_rot[a,2], cube_rot[b,2]],
            color="black",
            linewidth=2.5
        )

    # Body axes
    axes = [
        (np.array([1,0,0]), "red", "Roll"),
        (np.array([0,1,0]), "green", "Pitch"),
        (np.array([0,0,1]), "blue", "Yaw")
    ]

    for axis_vec, color, label in axes:
        a = R @ axis_vec
        ax.quiver(0,0,0,a[0],a[1],a[2],length=1.15,color=color,linewidth=2)
        ax.text(*(1.25*a), label, color=color)

    # Draw three reaction wheels and spinning spokes
    wheel_data = [
        ("x", "red", 0),
        ("y", "green", 1),
        ("z", "blue", 2)
    ]

    for axis, color, idx in wheel_data:
        circle = wheel_circle(axis)
        circle_rot = rotate(circle, R)
        ax.plot(circle_rot[:,0], circle_rot[:,1], circle_rot[:,2],
                color=color, linewidth=3)

        spoke1, spoke2 = wheel_spokes(axis, wheel_angle_hist[i, idx])
        spoke1_rot = rotate(spoke1, R)
        spoke2_rot = rotate(spoke2, R)

        ax.plot(spoke1_rot[:,0], spoke1_rot[:,1], spoke1_rot[:,2],
                color="orange", linewidth=4)
        ax.plot(spoke2_rot[:,0], spoke2_rot[:,1], spoke2_rot[:,2],
                color="orange", linewidth=4)

    # Angular velocity vector
    w = R @ omega_body_hist[i]
    speed = np.linalg.norm(w)

    if speed > 1e-5:
        w_dir = w / speed
        ax.quiver(0,0,0,w_dir[0],w_dir[1],w_dir[2],
                  length=1.45*speed/np.linalg.norm(omega_body_hist[0]),
                  color="purple", linewidth=4)

    ax.text2D(0.04, 0.90, "Orange spokes: spinning reaction wheels", transform=ax.transAxes)
    ax.text2D(0.04, 0.82, f"Body speed: {speed:.2f}", transform=ax.transAxes)

    ax.view_init(elev=25, azim=35)

ani = FuncAnimation(fig, animate, frames=frames, interval=40)

ani.save("reaction_wheel_3d_stabilization.gif", writer="pillow", fps=25)
print("Saved to:", os.path.join(os.getcwd(), "reaction_wheel_3d_stabilization.gif"))

plt.show()