// controllers/seoController.js
const Post = require('../models/Post')

exports.getPostSeo = async (req, res, next) => {
  try {
    const slug = req.params.slug
    const post = await Post.findOne({ slug })
      .select(
        'title description author createdAt updatedAt likesCount imageUrl content'
      )
      .populate('author', 'username')

    if (!post) {
      return res.status(404).json({ message: 'Post bulunamadı.' })
    }

    // Güvenli açıklama elde etme
    const rawDesc =
      post.description != null
        ? post.description
        : post.content != null
          ? post.content
          : ''
    const shortDesc =
      rawDesc.length > 150 ? rawDesc.slice(0, 150) + '...' : rawDesc

    // JSON-LD yapılandırılmış veri
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: shortDesc,
      image: post.imageUrl || '',
      author: {
        '@type': 'Person',
        name: post.author.username,
      },
      datePublished: post.createdAt.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'LikeAction' },
        userInteractionCount: post.likesCount || 0,
      },
    }

    // Open Graph meta etiketleri
    const og = {
      'og:title': post.title,
      'og:description': shortDesc,
      'og:type': 'article',
      'og:url': `${req.protocol}://${req.get('host')}/posts/${slug}`,
      'og:image': post.imageUrl || '',
      'og:site_name': 'Bay Blog',
    }

    // Twitter Card meta etiketleri
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
