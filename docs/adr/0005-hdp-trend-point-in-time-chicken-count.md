# HDP trend reconstructs Active Chicken Count per historical date

HDP (`estimated_egg_count / active_chicken_count`) is shown as a historical trend, and chicken
headcount changes over time via asset acquisitions and status-history reductions (dead/sold/missing).
Each trend point reconstructs Active Chicken Count as it was on that specific date (assets acquired
on/before that date, minus status reductions dated on/before that date), instead of applying today's
current headcount uniformly across the whole trend.

This is more expensive than a flat divide by today's count, and a reader might assume the simpler
approach was intended. We chose accuracy: using today's headcount against last month's egg production
would misstate the metric anytime the flock size has changed, which defeats the purpose of trending it.
