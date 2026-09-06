import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { toast } from "react-toastify";
import { FaBell, FaCheck } from "react-icons/fa";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const response = await api.get("/notifications/");

      // Remove duplicate notifications with the same message
      const uniqueNotifications = [
        ...new Map(
          (response.data || []).map((notification) => [
            notification.message,
            notification,
          ])
        ).values(),
      ];

      setNotifications(uniqueNotifications);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, is_read: true }
            : item
        )
      );
    } catch {
      toast.error("Unable to mark notification as read.");
    }
  };

  const unreadCount = notifications.filter(
    (x) => !x.is_read
  ).length;

  return (
    <Layout>
      <section className="hero-row">
        <div>
          <span className="eyebrow">
            BUDGETBUDDY UPDATES
          </span>

          <h2 className="page-title">
            Notifications
          </h2>

          <p className="muted">
            Stay updated with Premium requests and
            BudgetBuddy account activity.
          </p>
        </div>

        <span className="statement-count">
          {unreadCount} unread
        </span>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>
              <FaBell /> Notification Center
            </h3>

            <p className="muted">
              New Premium requests are delivered to
              administrators here.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="muted">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <div className="admin-empty">
            <FaBell />

            <div>
              <strong>
                No notifications yet
              </strong>

              <p className="muted">
                You are all caught up.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              className={`notification ${
                notification.is_read ? "read" : ""
              }`}
              key={notification.id}
            >
              <div>
                <strong>
                  {notification.type === "premium_request"
                    ? "Premium Request"
                    : notification.type ===
                      "premium_request_result"
                    ? "Premium Request Update"
                    : "BudgetBuddy Notification"}
                </strong>

                <p>
                  {notification.message}
                </p>

                <small>
                  {notification.created_at
                    ? new Date(
                        notification.created_at
                      ).toLocaleString()
                    : ""}
                </small>
              </div>

              {!notification.is_read && (
                <button
                  className="secondary small"
                  onClick={() =>
                    markAsRead(notification.id)
                  }
                >
                  <FaCheck /> Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </section>
    </Layout>
  );
}