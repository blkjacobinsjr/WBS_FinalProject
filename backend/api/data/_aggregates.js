import { Types } from "mongoose";

const { ObjectId } = Types;

/**
 * Returns the pipeline to get usage score for subscriptions
 */
export function subscriptionUsageAggregate(userId, id = null) {
  const matchFilter = {
    userId,
  };

  if (id) {
    matchFilter._id = new ObjectId(id);
  }

  const pipeline = [
    {
      $match: matchFilter,
    },
    {
      $lookup: {
        from: "usages",
        localField: "_id",
        foreignField: "subscriptionId",
        as: "subscriptionUsage",
      },
    },
    {
      $unwind: {
        path: "$subscriptionUsage",
      },
    },
    {
      $group: {
        _id: "$_id",
        totalScore: {
          $sum: "$subscriptionUsage.score",
        },
        count: {
          $sum: 1,
        },
        originalDoc: {
          $first: "$$ROOT",
        },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "originalDoc.category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
      },
    },
    {
      $addFields: {
        "originalDoc.averageScore": {
          $divide: ["$totalScore", "$count"],
        },
        "originalDoc.category": "$category",
        "originalDoc.count": "$count",
      },
    },
    {
      $replaceRoot: {
        newRoot: "$originalDoc",
      },
    },
    {
      $project: {
        subscriptionUsage: 0,
      },
    },
  ];

  return pipeline;
}

/**
 * Returns a pipeline that create full subscription data, including score, category,
 * array with all usages, whether the score is valid for calculations etc.
 */
export function fullSubscriptionData(userId) {
  const pipeline = [
    {
      $match: {
        userId,
      },
    },
    {
      $lookup: {
        from: "usages",
        localField: "_id",
        foreignField: "subscriptionId",
        as: "usages",
      },
    },
    {
      $addFields: {
        validScore: {
          $gte: [
            {
              $size: "$usages",
            },
            1,
          ],
        },
        monthlyPrice: {
          $cond: {
            if: {
              $eq: ["$interval", "year"],
            },
            then: {
              $divide: ["$price", 12],
            },
            else: "$price",
          },
        },
        usagesCount: {
          $size: "$usages",
        },
      },
    },
    {
      $addFields: {
        score: {
          $cond: [
            "$validScore",
            {
              $avg: "$usages.score",
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        isPotentialSaving: {
          $cond: [
            {
              $and: [
                "$validScore",
                {
                  $lte: ["$subscriptionScore", 2],
                },
              ],
            },
            true,
            false,
          ],
        },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  return pipeline;
}

/*
 * Return pipeline to get monthly savings per user
 */
export function potentialMonthlySavingsAggregate(userId) {
  const pipeline = [
    {
      $match: {
        userId,
      },
    },
    {
      $lookup: {
        from: "usages",
        localField: "_id",
        foreignField: "subscriptionId",
        as: "subscriptionUsage",
      },
    },
    {
      $project: {
        price: 1,
        interval: 1,
        usageCount: {
          $size: "$subscriptionUsage",
        },
        adjustedPrize: {
          $cond: [
            {
              $eq: ["$interval", "year"],
            },
            {
              $divide: ["$price", 12],
            },
            "$price",
          ],
        },
      },
    },
    {
      $match: {
        usageCount: {
          $gt: 0,
        },
      },
    },
    {
      $group: {
        _id: null,
        potentialMonthlySavings: {
          $sum: "$adjustedPrize",
        },
        count: {
          $sum: 1,
        },
      },
    },
  ];

  return pipeline;
}

/*
 * Return pipeline to get total monthly cost of all subscriptions
 */
export function totalMonthlyCostAggregate(userId) {
  const pipeline = [
    {
      $match: {
        userId,
      },
    },
    {
      $project: {
        price: 1,
        interval: 1,
        adjustedPrize: {
          $cond: [
            {
              $eq: ["$interval", "year"],
            },
            {
              $divide: ["$price", 12],
            },
            "$price",
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalCostPerMonth: {
          $sum: "$adjustedPrize",
        },
        count: {
          $sum: 1,
        },
      },
    },
  ];

  return pipeline;
}

/**
 * Returns the most or least used subscription (i.e. highest total score) for user
 * sort = -1 (default)    most used
 * sort = 1               least used
 */
export function mostUsedSubscriptionAggregate(userId, sort = -1) {
  const pipeline = subscriptionUsageAggregate(userId);

  const additionalStages = [
    {
      $match: {
        count: { $gte: 1 },
      },
    },
    {
      $sort: {
        averageScore: sort,
      },
    },
    {
      $limit: 1,
    },
  ];

  const finalPipeline = pipeline.concat(additionalStages);

  return finalPipeline;
}

/**
 * Returns pipeline needed for a search in a subscription and associated category
 */
export function searchAggregate(query) {
  const queryRegex = new RegExp(query, "i");

  const pipeline = [
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    {
      $match: {
        $or: [
          {
            name: {
              $regex: queryRegex,
            },
          },
          {
            interval: {
              $regex: queryRegex,
            },
          },
          {
            "categoryDetails.name": {
              $regex: queryRegex,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        category: {
          $arrayElemAt: ["$categoryDetails", 0],
        },
      },
    },
    {
      $project: {
        categoryDetails: 0,
      },
    },
  ];

  return pipeline;
}

/**
 * Returns an aggregate to get all used categories for user
 */
export function usedCategoriesAggregate(userId) {
  const pipeline = [
    {
      $match: {
        userId,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: "$category._id",
        category: "$category",
      },
    },
    {
      $group: {
        _id: "$category",
      },
    },
    {
      $replaceRoot: {
        newRoot: "$_id",
      },
    },
  ];

  return pipeline;
}

/**
 * Returns an aggregate to get all used categories for user, including ALL data about the
 * categories (score, costs, savings)
 */
export function usedCategoryFullDataAggregate(userId) {
  const pipeline = [
    {
      $match: {
        userId,
      },
    },
    {
      $lookup: {
        from: "usages",
        localField: "_id",
        foreignField: "subscriptionId",
        as: "subscriptionUsage",
      },
    },
    {
      $addFields: {
        validScore: {
          $gte: [
            {
              $size: "$subscriptionUsage",
            },
            1,
          ],
        },
        adjustedPrice: {
          $cond: {
            if: {
              $eq: ["$interval", "year"],
            },
            then: {
              $divide: ["$price", 12],
            },
            else: "$price",
          },
        },
      },
    },
    {
      $addFields: {
        subscriptionScore: {
          $cond: [
            "$validScore",
            {
              $avg: "$subscriptionUsage.score",
            },
            null,
          ],
        },
      },
    },
    {
      $addFields: {
        isPotentialSaving: {
          $cond: [
            {
              $and: [
                "$validScore",
                {
                  $lte: ["$subscriptionScore", 2],
                },
              ],
            },
            true,
            false,
          ],
        },
      },
    },
    {
      $project: {
        subscriptionUsage: 0,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryData",
      },
    },
    {
      $unwind: "$categoryData",
    },
    {
      $group: {
        _id: "$categoryData._id",
        name: {
          $first: "$categoryData.name",
        },
        icon: {
          $first: "$categoryData.icon",
        },
        subscriptionCount: {
          $sum: 1,
        },
        totalCost: {
          $sum: "$adjustedPrice",
        },
        averagePrice: {
          $avg: "$adjustedPrice",
        },
        potentialSavings: {
          $sum: {
            $cond: ["$isPotentialSaving", "$adjustedPrice", 0],
          },
        },
        validSubscriptionScores: {
          $push: {
            $cond: ["$validScore", "$subscriptionScore", "$$REMOVE"],
          },
        },
      },
    },
    {
      $addFields: {
        categoryScore: {
          $ifNull: [
            {
              $avg: "$validSubscriptionScores",
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        validSubscriptionScores: 0,
      },
    },
  ];

  return pipeline;
}

/**
 * Returns the most or least used subscription (i.e. highest total score) for user
 * sort = -1 (default)    most used
 * sort = 1               least used
 */
export function mostOrLeastUsedCategory(userId, sort = -1) {
  const pipeline = usedCategoryFullDataAggregate(userId);

  const additionalStages = [
    {
      $sort: {
        averageScore: sort,
      },
    },
    {
      $limit: 1,
    },
  ];

  const finalPipeline = pipeline.concat(additionalStages);

  return finalPipeline;
}

/**
 * Returns the least used and most expensive subscription
 */
export function barelyUsedMostExpensiveAggregate(userId) {
  const pipeline = [
    {
      $match: {
        userId,
      },
    },
    {
      $lookup: {
        from: "usages",
        localField: "_id",
        foreignField: "subscriptionId",
        as: "usages",
      },
    },
    {
      $addFields: {
        validScore: {
          $gte: [
            {
              $size: "$usages",
            },
            1,
          ],
        },
        monthlyPrice: {
          $cond: {
            if: {
              $eq: ["$interval", "year"],
            },
            then: {
              $divide: ["$price", 12],
            },
            else: "$price",
          },
        },
        usagesCount: {
          $size: "$usages",
        },
      },
    },
    {
      $addFields: {
        score: {
          $cond: [
            "$validScore",
            {
              $avg: "$usages.score",
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        isPotentialSaving: {
          $cond: [
            {
              $and: [
                "$validScore",
                {
                  $lte: ["$subscriptionScore", 2],
                },
              ],
            },
            true,
            false,
          ],
        },
      },
    },
    {
      $match: {
        validScore: true,
      },
    },
    {
      $sort: {
        score: 1,
        monthlyPrice: -1,
      },
    },
    {
      $limit: 1,
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
      },
    },
  ];

  return pipeline;
}
