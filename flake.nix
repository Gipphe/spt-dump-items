{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [
            (final: prev: {
              nodejs = prev.nodejs_20;
            })
          ];
        };
        inherit (pkgs) lib;

        inherit (builtins) fromJSON readFile;
        package = fromJSON (readFile ./package.json);
        zipFileName = "gipphe-sptdumpitems.zip";
        release = pkgs.writeShellApplication {
          name = "release";
          runtimeInputs = with pkgs; [
            cocogitto
            gh
            git
            pandoc
          ];
          text = ''
            cog bump --auto
            version="v$(cog -v get-version)"
            release_dir="./releases/$version"
            mkdir -p "$release_dir"
            cog changelog "$version" > "$release_dir/notes.md"
            pandoc --from=gfm --to=html -o "$release_dir/notes.html" "$release_dir/notes.md"
            cp -f "${self.packages.${system}.default}/${zipFileName}" "$release_dir/${zipFileName}"
            git push --follow-tags
            gh release create "$version" -F "$release_dir/notes.md" "$release_dir"/*
          '';
        };
      in
      {
        packages.default = pkgs.buildNpmPackage {
          pname = package.name;
          inherit (package) version;
          src = ./.;
          npmDepsHash = "sha256-XdPQugMzNaHTyjy5B7TpC6rxsCwwo/seINnkQLWEg2A=";
          installPhase = # bash
            ''
              mkdir -p $out
              mv dist/*.zip $out
            '';
          meta = {
            inherit (package) description homepage;
            license = lib.licenses.bsd3;
          };
        };
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs
            nixfmt-rfc-style
            cocogitto
            release
          ];
        };
      }
    );
}
