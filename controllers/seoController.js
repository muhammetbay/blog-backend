// controllers/seoController.js

const Post = require('../models/Post')

/**
 * @desc    Return JSON-LD, Open Graph & Twitter meta data for a post
 * @route   GET /api/seo/posts/:slug
 * @access  Public
 */
exports.getPostSeo = async (req, res, next) => {
  try {
    const slug = req.params.slug
    const post = await Post.findOne({ slug })
      .select(
        'title description author createdAt updatedAt likesCount imageUrl content'
      )
      .populate('author', 'username')

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' })
    }

    // 1) Safely derive a short description (max 150 chars)
    const rawDesc =
      post.description != null ? post.description : post.content || ''
    const shortDesc =
      rawDesc.length > 150 ? rawDesc.slice(0, 150) + '...' : rawDesc

    // 2) Build JSON-LD schema.org data
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: shortDesc,
      image: post.imageUrl || '',
      author: { '@type': 'Person', name: post.author.username },
      datePublished: post.createdAt.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'LikeAction' },
        userInteractionCount: post.likesCount || 0,
      },
    }

    // 3) Open Graph tags
    const og = {
      'og:title': post.title,
      'og:description': shortDesc,
      'og:type': 'article',
      'og:url': `${req.protocol}://${req.get('host')}/posts/${slug}`,
      'og:image': post.imageUrl || '',
      'og:site_name': 'Bay Blog',
    }

    // 4) Twitter Card tags
    const twitter = {
      'twitter:card': 'summary_large_image',
      'twitter:title': post.title,
      'twitter:description': shortDesc,
      'twitter:image': post.imageUrl || '',
      'twitter:site': '@bayblog',
      'twitter:creator': `@${post.author.username}`,
    }

    res.json({ jsonLd, og, twitter })
  } catch (err) {
    next(err)
  }
}
