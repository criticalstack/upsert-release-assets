const core = require('@actions/core');
const { GitHub, context } = require('@actions/github');
const fs = require('fs');
const path = require('path');

async function run() {
	try {
		// Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
		const github = new GitHub(process.env.GITHUB_TOKEN);

		// name of release
		const name = core.getInput('release_name', { required: true })
			.replace('refs/tags/', '')
			.replace('refs/head/', '');
		// release assets directory
		const dir = core.getInput('assets_directory', { required: true }) || 'dist';
		// owner of repository
		const owner = core.getInput('owner', { required: false }) || context.repo.owner;
		// name of repository
		const repo = core.getInput('repo', { required: false }) || context.repo.repo;

		let rel = null;
		try {
			rel = await github.repos.getReleaseByTag({
				owner: owner,
				repo: repo,
				tag: name,
			});
		} catch (error) {
			rel = await github.repos.createRelease({
				owner: owner,
				repo: repo,
				tag_name: name,
			});
		}

		const { data: { id: releaseId, upload_url: uploadUrl } } = rel;


		// upload all files in release directory
		if (fs.existsSync(dir)) {
			fs.readdirSync(dir, { withFileTypes: true })
				.filter(dirent => dirent.isFile())
				.map(async (dirent) => {
					const assetPath = path.join(dir, dirent.name)
					const headers = { 'content-type': 'text/plain', 'content-length': fs.statSync(assetPath).size };
					let asset = null;
					try {
						const asset = await github.repos.uploadReleaseAsset({
							url: uploadUrl,
							headers,
							name: path.basename(assetPath),
							data: fs.readFileSync(assetPath),
						});
					} catch (error) {
						const listAssetsForReleaseResponse = await github.repos.listReleaseAssets({
							owner: owner,
							repo: repo,
							release_id: releaseId,
						});
						const assets = listAssetsForReleaseResponse.data.map(asset => asset.id);
						for (const id of assets) {
							const getReleaseAssetResponse = await github.repos.getReleaseAsset({
								owner: owner,
								repo: repo,
								asset_id: id,
							})
							if (getReleaseAssetResponse.data.name == path.basename(assetPath)) {
								await github.repos.deleteReleaseAsset({
									owner: owner,
									repo: repo,
									asset_id: id,
								})
							}
						}
						await github.repos.uploadReleaseAsset({
							url: uploadUrl,
							headers,
							name: path.basename(assetPath),
							data: fs.readFileSync(assetPath),
						});
					}
			})
		}
	} catch (error) {
		core.setFailed(error.message);
	}
}

module.exports = run;
