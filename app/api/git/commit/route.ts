import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token, owner, repo, branch, fileName, code, commitMessage } = await request.json()

    if (!token || !owner || !repo || !fileName || !code || !commitMessage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Step 1: Get the current commit SHA of the branch
    const refResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CodeSync-App'
        }
      }
    )

    if (!refResponse.ok) {
      const error = await refResponse.json()
      return NextResponse.json(
        { error: `Failed to get branch reference: ${error.message}` },
        { status: refResponse.status }
      )
    }

    const refData = await refResponse.json()
    const currentCommitSha = refData.object.sha

    // Step 2: Get the current commit to get the tree SHA
    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${currentCommitSha}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CodeSync-App'
        }
      }
    )

    if (!commitResponse.ok) {
      const error = await commitResponse.json()
      return NextResponse.json(
        { error: `Failed to get commit: ${error.message}` },
        { status: commitResponse.status }
      )
    }

    const commitData = await commitResponse.json()
    const baseTreeSha = commitData.tree.sha

    // Step 3: Create a blob with the file content
    const blobResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'CodeSync-App'
        },
        body: JSON.stringify({
          content: code,
          encoding: 'utf-8'
        })
      }
    )

    if (!blobResponse.ok) {
      const error = await blobResponse.json()
      return NextResponse.json(
        { error: `Failed to create blob: ${error.message}` },
        { status: blobResponse.status }
      )
    }

    const blobData = await blobResponse.json()
    const blobSha = blobData.sha

    // Step 4: Create a new tree with the file
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'CodeSync-App'
        },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: [
            {
              path: fileName,
              mode: '100644',
              type: 'blob',
              sha: blobSha
            }
          ]
        })
      }
    )

    if (!treeResponse.ok) {
      const error = await treeResponse.json()
      return NextResponse.json(
        { error: `Failed to create tree: ${error.message}` },
        { status: treeResponse.status }
      )
    }

    const treeData = await treeResponse.json()
    const newTreeSha = treeData.sha

    // Step 5: Create a new commit
    const newCommitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'CodeSync-App'
        },
        body: JSON.stringify({
          message: commitMessage,
          tree: newTreeSha,
          parents: [currentCommitSha]
        })
      }
    )

    if (!newCommitResponse.ok) {
      const error = await newCommitResponse.json()
      return NextResponse.json(
        { error: `Failed to create commit: ${error.message}` },
        { status: newCommitResponse.status }
      )
    }

    const newCommitData = await newCommitResponse.json()
    const newCommitSha = newCommitData.sha

    // Step 6: Update the branch reference
    const updateRefResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'CodeSync-App'
        },
        body: JSON.stringify({
          sha: newCommitSha,
          force: false
        })
      }
    )

    if (!updateRefResponse.ok) {
      const error = await updateRefResponse.json()
      return NextResponse.json(
        { error: `Failed to update reference: ${error.message}` },
        { status: updateRefResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully committed to GitHub!',
      commitSha: newCommitSha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`
    })

  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json(
      { error: 'Failed to commit to GitHub. Please check your credentials and try again.' },
      { status: 500 }
    )
  }
}