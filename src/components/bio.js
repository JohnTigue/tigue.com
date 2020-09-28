/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"

import { rhythm } from "../utils/typography"

const Bio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      avatar: file(absolutePath: { regex: "/profile-pic.jpg/" }) {
        childImageSharp {
          fixed(width: 50, height: 50) {
            ...GatsbyImageSharpFixed
          }
        }
      }
      site {
        siteMetadata {
          author
          social {
            twitter
          }
        }
      }
    }
  `)

  const { author, social } = data.site.siteMetadata
  return (
    <div
      style={{
        display: `flex`,
        marginBottom: rhythm(0.25), 
      }}
      >

      {/*
      <Image
        fixed={data.avatar.childImageSharp.fixed}
        alt={author}
        style={{
          marginRight: rhythm(1 / 2),
          marginBottom: 0,
          minWidth: 50,
          borderRadius: `100%`,
        }}
        imgStyle={{
          borderRadius: `50%`,
        }}
      /> */}
      <p style={{textAlign:`center`, width:"100%"}}>
        { /*
        Tech writting by <strong>{author}</strong> (
        <a href={`https://twitter.com/${social.twitter}`}>
          Twitter as @{`${social.twitter}`}
        </a>)
          */ }
    

      <a href="https://twitter.com/johntigue" ><img src="/round_icons/twitter.svg" width="65px" style={{paddingBottom: "3px" }}/></a>

      <a href="https://github.com/johntigue" ><img src="/round_icons/github.svg" width="68px" style={{"padding": "7px" }}/></a>

      <a href="http://reconstrue.com/"><img class="reconstrue" src="/round_icons/reconstrue_logo_brandmark.svg" width="68px" style={{padding: "6px 2px 6px 2px" }}/></a>
    
      <a href="mailto:john@tigue.com"><img src="/round_icons/email.svg" width="68px" style={{"padding": "7px" }}/></a>

      <a href="http://tigue.com/rss.xml"><img src="/round_icons/rss.svg" width="68xpx" style={{"padding": "7px" }}/></a>
      </p>

    </div>
  )
}

export default Bio
