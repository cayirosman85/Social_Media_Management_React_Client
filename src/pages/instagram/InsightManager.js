// InsightManager.jsx
import React, { useState, useEffect } from "react";
import { getProfileInsights } from "../../services/instagram/instagramService.js";
import "./InsightManager.css";
import ls from "local-storage";
/**
 * InsightManager Component
 * Displays Instagram profile insights with loading states and error handling
 * Fetches and renders various metrics including reach, engagement, and follower data
 */
const InsightManager = () => {
  // State Management
  const [state, setState] = useState({
    isLoading: true,
    error: null,
    insightsData: {},
  });

  // Fetch insights on component mount
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const data = await getProfileInsights(
          ls.get("userId"),
          ls.get("facebookAccessToken"),
       
        );
        
        setState(prev => ({
          ...prev,
          insightsData: data || {},
          isLoading: false,
        }));
        console.log("Insights Data:", data);
      } catch (error) {
        console.error("Insights Fetch Error:", error);
        setState(prev => ({
          ...prev,
          error: `Failed to fetch insights: ${error.message}`,
          isLoading: false,
        }));
      }
    };

    fetchInsights();
  }, []);

  // Utility Functions
  const formatMetricName = (name) =>
    name
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const isAudienceMetric = (metricName) =>
    ["audience_city", "audience_country", "audience_gender_age", "audience_locale"].includes(metricName);

  // Render States
  if (state.isLoading) {
    return (
      <div className="insight-loading">
        <div className="spinner animate-spin"></div>
        <p className="loading-text">Loading Insights...</p>
      </div>
    );
  }

  if (state.error) {
    return <div className="insight-error">{state.error}</div>;
  }

  return (
    <section className="insights-wrapper">
      <h2 className="insights-title">Instagram Profile Insights</h2>
      
      {state.insightsData.data?.length > 0 ? (
        <div className="insights-grid">
          {state.insightsData.data.map((insight, index) => (
            <InsightCard
              key={`${insight.name}-${index}`}
              insight={insight}
              formatMetricName={formatMetricName}
              isAudienceMetric={isAudienceMetric}
            />
          ))}
        </div>
      ) : (
        <p className="no-data">No insights available at this time.</p>
      )}
    </section>
  );
};

/**
 * InsightCard Component
 * Renders individual insight metrics in a card format
 * @param {Object} insight - The insight data object
 * @param {Function} formatMetricName - Function to format metric names
 * @param {Function} isAudienceMetric - Function to check if metric is audience-related
 */
const InsightCard = ({ insight, formatMetricName, isAudienceMetric }) => (
  <div className="insight-card">
    <h3 className="card-title">{formatMetricName(insight.name)}</h3>
    <p className="card-description">{insight.description}</p>
    
    {isAudienceMetric(insight.name) ? (
      <div className="audience-metrics">
        {insight.values?.[0]?.value ? (
          Object.entries(insight.values[0].value).map(([key, value]) => (
            <div key={key} className="metric-row">
              <span className="metric-key">{key}</span>
              <span className="metric-value">{value || 0}</span>
            </div>
          ))
        ) : (
          <p className="no-data">0</p>
        )}
      </div>
    ) : (
      <div className="standard-metrics">
        <p className="metric-value">
          {insight.values?.[0]?.value ?? 0}
        </p>
        <p className="metric-period">
          Period: {insight.period || ""}
        </p>
      </div>
    )}
  </div>
);

export default InsightManager;