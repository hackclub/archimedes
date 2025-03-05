export interface Config {
	loops: {
		audienceFilter: Record<string, unknown> | null;
		audienceSegmentId: string | null;
	};
}

const stagingConfig: Config = {
	loops: {
		audienceFilter: {
			AND: [
				{
					key: "email",
					value: "hi@skyfall.dev",
					operation: "contains",
				},
			],
		},
		audienceSegmentId: "cm7j9be4v01dkk2vxh63ey3h9",
	},
};
const productionConfig: Config = {
	loops: {
		audienceFilter: null,
		audienceSegmentId: null,
	},
};
// export const config =
//   process.env.NODE_ENV === "production" ? productionConfig : stagingConfig;
export const config = stagingConfig;
